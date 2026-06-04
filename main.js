const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// ── IPC Registration ──────────────────────────────────────────
// Each line is uncommented when that phase is built
function registerAllIPC() {
  // Phase 2:  require('./src/ipc/auth.ipc');
  // Phase 3:  require('./src/ipc/settings.ipc');
  // Phase 4:  require('./src/ipc/medicines.ipc');
  // Phase 5:  require('./src/ipc/suppliers.ipc');
  // Phase 6:  require('./src/ipc/batches.ipc');
  //           require('./src/ipc/inventory.ipc');
  //           require('./src/ipc/expiry.ipc');
  // Phase 7:  require('./src/ipc/purchases.ipc');
  // Phase 8:  require('./src/ipc/billing.ipc');
  // Phase 9:  require('./src/ipc/patients.ipc');
  // Phase 10: require('./src/ipc/drug-register.ipc');
  // Phase 11: require('./src/ipc/returns.ipc');
  // Phase 12: require('./src/ipc/day-closing.ipc');
  // Phase 13: require('./src/ipc/backup.ipc');
  // Phase 14: require('./src/ipc/reports.ipc');
  // Phase 15: require('./src/ipc/notifications.ipc');
  // Phase 16: require('./src/ipc/logs.ipc');
}

// ── Window ────────────────────────────────────────────────────
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false   // ← change to false — needed for better-sqlite3
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/ui/pages/login/login.html'))
    .catch(() => {
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pharmacy PMS</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .container {
                text-align: center;
                padding: 2rem;
                border-radius: 12px;
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(255,255,255,0.1);
              }
              h1 { color: #38bdf8; }
              p  { color: #94a3b8; }
              .badge {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                background: #0369a1;
                color: #e0f2fe;
                border-radius: 9999px;
                font-size: 0.875rem;
                margin-top: 1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Pharmacy PMS</h1>
              <p>Phase 0 complete. Window is active.</p>
              <div class="badge">Electron Ready</div>
            </div>
          </body>
        </html>
      `));
    });
}

// ── App Lifecycle ─────────────────────────────────────────────
app.whenReady().then(() => {
  registerAllIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
