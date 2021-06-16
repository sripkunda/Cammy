const { app, BrowserWindow, Menu, Tray } = require('electron')
const path = require('path');
const Cammy = require('./js/native/window');

app.whenReady().then(() => {

  Cammy.newEditor();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await Cammy.newEditor();
  });

  // Create tray for Cammy
  tray = new Tray(path.join(__dirname, 'img/icon.png'));
  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'New Note', click: function () {
        Cammy.newEditor();
      }
    },
    {
      label: 'Exit Cammy', click: function () {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});
