const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Modules will be added here phase by phase
  // Phase 2:  auth: { login, logout }
  // Phase 3:  settings: { get, set }
  // Phase 4:  medicines: { search, create, update }
  // ... and so on
});