const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'public', 'icon-192.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Evita que la página bloquee el cierre (cruz o Alt+F4)
  win.webContents.on('will-prevent-unload', (e) => e.preventDefault());

  win.on('close', () => {
    win.destroy();
  });

  win.on('closed', () => {
    win = null;
    app.quit();
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
