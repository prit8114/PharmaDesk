const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (username, pin) => ipcRenderer.invoke('auth:login', username, pin),
    logout: () => ipcRenderer.invoke('auth:logout'),
    changePin: (currentPIN, newPIN) => ipcRenderer.invoke('auth:change-pin', currentPIN, newPIN),
    completePinChange: (userId, currentPIN, newPIN) => ipcRenderer.invoke('auth:complete-pin-change', userId, currentPIN, newPIN),
    getSession: () => ipcRenderer.invoke('auth:get-session')
  },
  // Phase 3:  settings: { get, set }
  // Phase 4:  medicines: { search, create, update }
  // ... and so on
});