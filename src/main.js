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

const createConfigManager = (filePath) => ({
    read: () => readJsonConfig(filePath),
    save: (data) => saveJsonConfig(filePath, data)
});

const configs = {
    user: createConfigManager(userConfigPath),
    window: createConfigManager(windowConfigPath),
    stats: createConfigManager(statSettingsPath)
};

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
    } catch {}
}

const windowManager = {
    getState: () => configs.window.read().then(config => ({
        x: config.winX,
        y: config.winY
    })),
    saveState: (win) => {
        const [x, y] = win.getPosition();
        return configs.window.save({ winX: x, winY: y });
    }
};

app.whenReady().then(async () => {
    const windowState = await windowManager.getState();

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

    // Devtools
    //win.webContents.openDevTools({ mode: 'detach' });

    win.on('move', () => windowManager.saveState(win));
    win.on('close', () => windowManager.saveState(win));
});

const ipcHandlers = {
    async 'fetch-stats'() {
        const user = await configs.user.read();
        if (!user.uid) return null;
        return getStats(user.uid, user.mode, user.client_id, user.client_secret);
    },
    'get-user-config': () => configs.user.read(),
    async 'credentials-set'() {
        const user = await configs.user.read();
        return !!(user.uid && user.client_id && user.client_secret);
    },
    'get-stat-settings': () => configs.stats.read()
};

Object.entries(ipcHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, (_, ...args) => handler(...args));
});

ipcMain.on('window-minimize', () => win?.minimize());
ipcMain.on('window-close', () => win?.close());

ipcMain.on('save-credentials', async (_, creds) => {
    const user = await configs.user.read();
    const newConfig = { ...user, ...creds };
    await configs.user.save(newConfig);
});

ipcMain.on('save-stat-settings', async (_, settings) => {
    await configs.stats.save(settings);
});