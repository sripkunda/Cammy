const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron')
const path = require('path');
const Cammy = require('./js/native/window');

app.whenReady().then(() => {

  // Create tray for Cammy

  const image = nativeImage.createFromPath(
    path.join(__dirname, "img/icon.png")
  );

  tray = new Tray(image.resize({ width: 16, height: 16 }));
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

  Cammy.newEditor();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await Cammy.newEditor();
  });

});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});
