const { BrowserWindow, Menu, MenuItem, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const CammyPreferences = require('./preferences');

class Cammy {

    window;
    name;
    filePath;
    saved;
    watcher;
    listeners = [];

    constructor(win, nam, fp) {
        this.window = win;
        this.name = nam;
        this.filePath = fp;
        this.saved = true;
        this.#init();
    }

    #init() {
        this.#setContextMenu();
        this.#setWindowMenu();
        this.#setListeners();

        this.window.webContents.on("did-finish-load", async () => {
            this.#loadContent();

            var theme = await CammyPreferences.get('editor.theme');
            if (theme) CammyPreferences.setColorTheme(theme);

            var mode = await CammyPreferences.get('editor.mode');
            if (mode) CammyPreferences.setEditorMode(mode);
        });

        this.window.on('close', (e) => {
            e.preventDefault();
            if (!this.saved) {
                var choice = dialog.showMessageBoxSync(this.window,
                    {
                        type: 'question',
                        buttons: ['Cancel', 'Save', 'Quit'],
                        title: 'Unsaved Changes',
                        message: 'Your note has unsaved changes. Do you want to discard them? '
                    });

                if (choice == 0) {
                    return;
                } else if (choice == 1) {
                    e.preventDefault();
                    this.save();
                }
            }
            this.quit();
        });
    }

    #setListeners() {

        const name = 'contentchanged-' + this.window.webContents.getProcessId();

        var contentHandler = (e, args) => {
            if (this.saved) {
                this.saved = false;
                this.#retitle();
            }
        };

        var saveHandler = (e, args) => {
            let cont = args.content;
            fs.writeFile(args.path, cont, err => {
                if (err) {
                    return Cammy.err("Something went wrong while saving your file. Please report an issue if this error persists.");
                }
            });
        };

        ipcMain.on(name, contentHandler);
        this.listeners.push({ channel: name, handler: contentHandler, emitter: ipcMain });

        ipcMain.on('save', saveHandler);
        this.listeners.push({ channel: 'save', handler: saveHandler, emitter: ipcMain });

    }

    #retitle() {
        if (this) {
            this.window.setTitle((this.saved ? "" : "• ") + this.name + " - Cammy Notepad");
        } else {
            delete this;
        }
    }

    #setWindowMenu() {
        const menu = Menu.buildFromTemplate(this.menuTemplate);
        this.window.setMenu(menu);
    }

    #setContextMenu() {
        // In App Context Menu
        this.window.webContents.on('context-menu', (event, params) => {
            const menu = new Menu();

            menu.append(new MenuItem({
                label: "Save",
                click: () => { this.save() }
            })
            );

            menu.append(new MenuItem({
                label: "Save As",
                click: () => { this.save(true) }
            })
            );

            menu.popup()
        });
    }

    #loadContent() {

        if (this.filePath) {
            this.name = path.basename(this.filePath);
            const cont = fs.readFileSync(this.filePath);
            if (!cont) return Cammy.err("Something went wrong while opening this file. Please report an issue if this error persists.");
            this.window.webContents.send('setcontent', { content: cont.toString() });
        }
        this.#retitle();
    }

    #writeToFile(pat) {

        this.filePath = pat;

        this.window.webContents.send('savecontent', { path: pat });

        this.name = path.basename(this.filePath);
        this.saved = true;
        this.#retitle();
    }

    quit() {
        this.listeners.forEach((li, i) => {
            ipcMain.removeListener(li.channel, li.handler);
            delete this.listeners[i];
        });

        this.window.destroy();
    }

    save(as) {
        const opts = {
            title: "Save As - Cammy Notepad",
            defaultPath: "Untitled Note.md",
            options: ['treatPackageAsDirectory', 'createDirectory', 'showOverwriteConfirmation'],
            filters: [
                { name: 'Markdown', extensions: ['md'] },
                { name: 'Text Files', extensions: ['txt', 'doc'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        }

        var pat = this.filePath;

        if (as || !pat) {
            pat = dialog.showSaveDialogSync(this.window, opts);
            if (!pat) return;

            fs.stat(pat, (err, stats) => {
                if (stats && stats.isFile()) {
                    var choice = dialog.showMessageBoxSync(this.window,
                        {
                            type: 'question',
                            buttons: ['Back', 'Replace'],
                            title: 'Replace File',
                            message: 'The file "' + path.basename(pat) + '" already exists. Are you sure you want to replace this file?'
                        });

                    if (choice == 0) {
                        return this.save(true);
                    }
                }

                this.#writeToFile(pat);
            });
        } else {
            this.#writeToFile(pat);
        }
    }

    static open() {
        const options = {
            title: "Open - Cammy Notepad",
            properties: ['openFile']
        };
        const res = dialog.showOpenDialogSync(options);

        if (res && res.length > 0) {
            let pat = res[0];
            Cammy.newEditor(path.basename(pat), pat);
        }

    }

    static createEditorWindow() {

        // Create browser window
        const mainWindow = new BrowserWindow({
            width: 1000,
            height: 800,
            icon: './img/icon.png',
            webPreferences: {
                spellcheck: true,
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                preload: path.join('./preload.js'),
            },
        });

        mainWindow.webContents.toggleDevTools();

        mainWindow.loadFile('index.html');

        return mainWindow;
    }

    static newEditor(nam, fp) {
        return new Cammy(Cammy.createEditorWindow(), nam ? nam : "Untitled", fp ? fp : null);
    }

    static err(msg) {
        dialog.showMessageBoxSync(this.window, { type: "error", message: msg });
    }

    menuTemplate = [
        {
            id: "file",
            label: "File",
            submenu: [
                {
                    click: () => { Cammy.newEditor() },
                    label: "New Note",
                    accelerator: "CommandOrControl+N"
                },
                {
                    label: "Open",
                    accelerator: "CommandOrControl+O",
                    click: () => { Cammy.open() }
                },
                {
                    label: "Save",
                    accelerator: "CommandOrControl+S",
                    click: () => { this.save() }
                },
                {
                    label: "Save As",
                    accelerator: "CommandOrControl+Shift+S",
                    click: () => { this.save(true) }
                },
            ]
        },
        {
            id: 'edit',
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                {
                    label: 'Add To Calendar',
                    accelerator: 'CommandOrControl+Shift+A'
                }
            ]
        },
        {
            id: "view",
            label: "View",
            submenu: [
                {
                    role: "zoomin"
                },
                {
                    role: "zoomout"
                },
                {
                    role: "resetzoom"
                }
            ]
        },
        {
            id: "window",
            label: "Window",
            submenu: [
                {
                    role: "minimize"
                },
                {
                    role: "close"
                },
                {
                    role: "reload"
                },
                {
                    label: "Switch Color Theme",
                    accelerator: "CommandOrControl+Shift+,",
                    click: async () => {
                        const config = await CammyPreferences.get('editor.theme');
                        const theme = config && config == 'dark' ? 'light' : 'dark';
                        await CammyPreferences.set('editor.theme', theme);
                        CammyPreferences.setColorTheme(theme);
                    }
                },
                {
                    label: "Toggle Event Recognition",
                    accelerator: "CommandOrControl+Shift+.",
                    click: async () => {
                        const config = await CammyPreferences.get('editor.mode');
                        const mode = config && config == 'planner' ? 'text' : 'planner';
                        await CammyPreferences.set('editor.mode', mode);
                        CammyPreferences.setEditorMode(mode);
                    }
                },
            ]
        },
        {
            id: "cammy",
            label: "Cammy",
            submenu: [
                {
                    label: "Help",

                },
                {
                    label: "Check For Updates"
                },
                {
                    label: "Website"
                },
            ]
        },
    ];

}

module.exports = Cammy;
