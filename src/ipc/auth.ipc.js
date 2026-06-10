const { ipcMain } = require('electron');
const authService = require('../modules/auth/auth.service');

function registerAuthIPC() {
  ipcMain.handle('auth:login', async (event, username, pin) => {
    try {
      return authService.login(username, pin);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:logout', async (event) => {
    try {
      authService.logout();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:change-pin', async (event, currentPIN, newPIN) => {
    try {
      const updatedUser = authService.changePIN(currentPIN, newPIN);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:complete-pin-change', async (event, userId, currentPIN, newPIN) => {
    try {
      // service.completePINChange already returns { success: true, user }
      return authService.completePINChange(userId, currentPIN, newPIN);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:get-session', async (event) => {
    try {
      const session = authService.getSession();
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAuthIPC };
