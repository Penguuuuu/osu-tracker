const { app, BrowserWindow } = require('electron');

function createWindow () {
const win = new BrowserWindow({
width: 500,
height: 600,
hasShadow: false,
transparent: true,
roundedCorners: false,
frame: false,
autoHideMenuBar: true,
webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
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