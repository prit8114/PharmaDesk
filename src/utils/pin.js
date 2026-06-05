const crypto = require('node:crypto');

function normalizePIN(pin) {
    const value = String(pin ?? '').trim();

    if (!/^\d{4,6}$/.test(value)) {
        throw new Error('PIN must be 4-6 digits');
    }

    return value;
}

function hashPIN(pin) {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

module.exports = {
    hashPIN,
    normalizePIN,
};