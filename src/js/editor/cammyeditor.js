const editorModes = require("./js/editor/data/editorModes.json");

class CammyEditor {

    static editorMode = Object.keys(editorModes)[0];
    editor;
    line;
    saved;
    cpid;

    constructor(opt, lin) {
        this.editor = new EasyMDE(opt);
        this.line = lin;
        this.saved = false;
        this.cpid = remote.getCurrentWebContents().getProcessId();
        this.editor.codemirror.focus();
    }

    updateState(bAddToCalendar) {
        if (editorModes[CammyEditor.editorMode] && editorModes[CammyEditor.editorMode].parseEvents) parse(bAddToCalendar == true ? true : false);
        this.line = this.editor.codemirror.getCursor().line;
        document.querySelectorAll(".CodeMirror-line").forEach((e, i) => {
            if (i != this.line) {
                e.querySelectorAll('.cm-formatting').forEach((el) => { el.style.display = 'none'; });
                e.querySelectorAll('.cm-url').forEach((el) => { el.style.display = 'none'; });

            }

            else {
                e.querySelectorAll('.cm-formatting').forEach((el) => { el.style.display = 'inline'; });
                e.querySelectorAll('.cm-url').forEach((el) => { el.style.display = 'inline'; });
            }
        });
    }

    updateSaveState() {
        ipcRenderer.send('contentchanged-' + this.cpid);
    }

    rename(nam) {
        this.name = nam;
    }

    getContent() {
        return this.editor.value();
    }

    setContent(c) {
        this.editor.value(c);
    }

    static setEditorMode(mode) {
        CammyEditor.editorMode = mode;
        if (!editorModes[mode].parseEvents)
            for (var i = 0; i < document.querySelectorAll(".CodeMirror-line").length; i++)
                formatLine(i, 'none');
    }

    static setColorTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    }
}
