const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
const win = new BrowserWindow({
width: 800,
height: 600,
hasShadow: false,
roundedCorners: false,
frame: false,
autoHideMenuBar: true,
webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
}
});

win.loadFile('index.html');
    win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
if (BrowserWindow.getAllWindows().length === 0) createWindow();
});