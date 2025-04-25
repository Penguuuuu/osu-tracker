const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const customUserDataDir = path.join(app.getPath('home'), '.config', 'osu-tracker-patchouli');
app.setPath('userData', customUserDataDir);

const { getStats } = require('./api');
const userDataDir = app.getPath('userData');
const userConfigPath = path.join(userDataDir, 'user.json');
const windowConfigPath = path.join(userDataDir, 'window.json');
const statSettingsPath = path.join(userDataDir, 'statSettings.json');

let win;

async function readJsonConfig(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function saveJsonConfig(filePath, config) {
    try {
        await fs.writeFile(filePath, JSON.stringify(config, null, 4), 'utf8');
    } catch (err) {
        console.error(`Failed to save config at ${filePath}:`, err);
    }
}

async function readUserConfig() {
    return readJsonConfig(userConfigPath);
}

async function saveUserConfig(config) {
    return saveJsonConfig(userConfigPath, config);
}

async function readWindowConfig() {
    return readJsonConfig(windowConfigPath);
}

async function saveWindowConfig(state) {
    return saveJsonConfig(windowConfigPath, state);
}

async function readStatSettings() {
    return readJsonConfig(statSettingsPath);
}

async function saveStatSettings(settings) {
    return saveJsonConfig(statSettingsPath, settings);
}

async function getWindowState() {
    const config = await readWindowConfig();
    return {
        x: typeof config.winX === 'number' ? config.winX : undefined,
        y: typeof config.winY === 'number' ? config.winY : undefined
    };
}

async function saveWindowState(win) {
    const [x, y] = win.getPosition();
    await saveWindowConfig({ winX: x, winY: y });
}

app.whenReady().then(async () => {
    const windowState = await getWindowState();

    win = new BrowserWindow({
        width: 460,
        height: 600,
        x: windowState.x,
        y: windowState.y,
        frame: false,
        resizable: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'renderer.js')
        }
    });

    win.setMenu(null);
    win.loadFile(path.join(__dirname, '../public/index.html'));

    // Enable DevTools for debugging
    //win.webContents.openDevTools({ mode: 'detach' });

    win.on('move', () => saveWindowState(win));
    win.on('close', () => saveWindowState(win));
});

ipcMain.handle('fetch-stats', async () => {
    const user = await readUserConfig();
    if (!user.uid) {
        return null;
    }
    return getStats(user.uid, user.mode, user.client_id, user.client_secret);
});

ipcMain.handle('get-user-config', readUserConfig);

ipcMain.handle('credentials-set', async () => {
    const user = await readUserConfig();
    return !!(user.uid && user.client_id && user.client_secret);
});

ipcMain.handle('get-stat-settings', readStatSettings);

ipcMain.on('window-minimize', () => win?.minimize());
ipcMain.on('window-close', () => win?.close());

ipcMain.on('save-credentials', async (event, creds) => {
    const existingConfig = await readUserConfig();
    const newConfig = { ...existingConfig, ...creds };
    await saveUserConfig(newConfig);
});

ipcMain.on('save-stat-settings', async (event, settings) => {
    await saveStatSettings(settings);
});