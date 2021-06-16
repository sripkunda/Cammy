const { webContents } = require('electron');
const settings = require('electron-settings');

class CammyPreferences {
    static setColorTheme(t) {
        webContents.getAllWebContents().forEach((w) => {
            w.send("colorThemeChanged", { theme: t });
        });
    }

    static setEditorMode(t) {
        webContents.getAllWebContents().forEach((w) => {
            w.send("editorModeChanged", { mode: t });
        });
    }

    static async get(c) {
        return await settings.get(c); 
    }

    static async set(c, v) {
        return await settings.set(c, v);
    }

    static async addTask(v) {
        let c = 'tasks'; 
        var et = await this.get(c); 
        if (et)  
            return await settings.set('task', v);
    }
}

module.exports = CammyPreferences;
