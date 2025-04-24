const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('osuAPI', {
    fetchStats: () => ipcRenderer.invoke('fetch-stats'),
    minimize: () => ipcRenderer.send('window-minimize'),
    close: () => ipcRenderer.send('window-close'),
    saveCredentials: (creds) => ipcRenderer.send('save-credentials', creds),
    getUserConfig: () => ipcRenderer.invoke('get-user-config'),
    credentialsSet: () => ipcRenderer.invoke('credentials-set'),
    saveStatSettings: (settings) => ipcRenderer.send('save-stat-settings', settings),
    getStatSettings: () => ipcRenderer.invoke('get-stat-settings')
});