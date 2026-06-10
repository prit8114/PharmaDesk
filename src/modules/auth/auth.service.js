const authRepo = require('./auth.repository');

let currentSession = null;

function createSession(user) {
  currentSession = {
    userId:   user.id,
    username: user.username,
    role:     user.role,
    fullName: user.full_name,
    loginAt:  new Date().toISOString()
  };
  return currentSession;
}

function getSession() {
  return currentSession;
}

function clearSession() {
  currentSession = null;
}

function requireAuth() {
  if (!currentSession) throw new Error('Not authenticated');
  return currentSession;
}

function requireRole(role) {
  const session = requireAuth();
  if (Array.isArray(role)) {
    if (!role.includes(session.role)) throw new Error('Insufficient permissions');
  } else {
    if (session.role !== role) throw new Error('Insufficient permissions');
  }
  return session;
}

function login(username, pin) {
  const result = authRepo.authenticateUser(username, pin);
  
  if (result.success && !result.requiresPINChange) {
    createSession(result.user);
  }
  
  return result;
}

function logout() {
  clearSession();
}

function changePIN(currentPIN, newPIN) {
  const session = requireAuth();
  const updatedUser = authRepo.changeUserPIN({ 
    userId: session.userId, 
    currentPIN, 
    newPIN 
  });
  
  return updatedUser;
}

function completePINChange(userId, currentPIN, newPIN) {
  const updatedUser = authRepo.changeUserPIN({ userId, currentPIN, newPIN });
  createSession(updatedUser);
  return { success: true, user: updatedUser };
}

module.exports = { 
  getSession, 
  clearSession, 
  requireAuth, 
  requireRole,
  login,
  logout,
  changePIN,
  completePINChange
};