const { isValidPIN } = require('../../utils/validate.utils');

function validateLogin(username, pin) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
        throw new Error('Username is required and must be a valid string.');
    }
    
    if (!isValidPIN(pin)) {
        throw new Error('PIN must be 4 to 6 numeric digits.');
    }
}

function validateChangePIN(currentPIN, newPIN) {
    if (!isValidPIN(currentPIN)) {
        throw new Error('Current PIN is invalid. It must be 4 to 6 numeric digits.');
    }
    
    if (!isValidPIN(newPIN)) {
        throw new Error('New PIN is invalid. It must be 4 to 6 numeric digits.');
    }
    
    if (String(currentPIN) === String(newPIN)) {
        throw new Error('New PIN cannot be the same as the current PIN.');
    }
}

function validateCompletePINChange(userId, currentPIN, newPIN) {
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        throw new Error('A valid User ID is required.');
    }
    
    validateChangePIN(currentPIN, newPIN);
}

module.exports = {
    validateLogin,
    validateChangePIN,
    validateCompletePINChange
};
