const { db } = require('../../database/database');
const { hashPIN, normalizePIN, verifyPIN } = require('../../utils/pin');

function sanitizeUser(user) {
    if (!user) {
        return null;
    }

    const {
        pin_hash,
        ...safeUser
    } = user;

    return safeUser;
}

function getUserById(userId) {
    return db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
}

function getUserByUsername(username) {
    return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
}

function createUserAccount({ username, pin, fullName, phone = null, status = 'active', role = null }) {
    const normalizedUsername = String(username || '').trim();

    if (!normalizedUsername) {
        throw new Error('Username is required');
    }

    const normalizedPIN = normalizePIN(pin);
    const normalizedFullName = String(fullName || '').trim();

    if (!normalizedFullName) {
        throw new Error('Full name is required');
    }

    const insertColumns = ['username', 'pin_hash', 'full_name', 'phone', 'status', 'is_first_login'];
    const insertValues = [normalizedUsername, hashPIN(normalizedPIN), normalizedFullName, phone, status, 1];

    if (role !== null && role !== undefined && String(role).trim() !== '') {
        insertColumns.splice(3, 0, 'role');
        insertValues.splice(3, 0, String(role).trim());
    }

    const placeholders = insertColumns.map(() => '?').join(', ');

    db.prepare(`
      INSERT INTO users (${insertColumns.join(', ')})
      VALUES (${placeholders})
    `).run(...insertValues);

    return sanitizeUser(getUserByUsername(normalizedUsername));
}

function authenticateUser(username, pin) {
    const user = getUserByUsername(String(username || '').trim());

    if (!user) {
        return { success: false, reason: 'invalid_credentials' };
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, reason: 'account_locked', lockedUntil: user.locked_until };
    }

    if (user.status !== 'active') {
        return { success: false, reason: 'inactive_account' };
    }

    let normalizedPIN;

    try {
        normalizedPIN = normalizePIN(pin);
    } catch (err) {
        return { success: false, reason: 'invalid_pin_format' };
    }

        if (!verifyPIN(normalizedPIN, user.pin_hash)) {
        db.prepare(`
          UPDATE users
          SET failed_attempts = failed_attempts + 1,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(user.id);

        const updated = db.prepare(`SELECT failed_attempts FROM users WHERE id = ?`).get(user.id);
        if (updated.failed_attempts >= 5) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min lockout
            db.prepare(`UPDATE users SET locked_until = ?, updated_at = datetime('now') WHERE id = ?`)
                .run(lockUntil, user.id);
        }

        return { success: false, reason: 'invalid_credentials' };
    }

    if (Number(user.is_first_login) === 1) {
        db.prepare(`
          UPDATE users
          SET failed_attempts = 0,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(user.id);

        return {
            success: true,
            requiresPINChange: true,
            user: sanitizeUser(user),
        };
    }

    db.prepare(`
      UPDATE users
      SET failed_attempts = 0,
          last_login = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(user.id);

    return {
        success: true,
        requiresPINChange: false,
        user: sanitizeUser(getUserById(user.id)),
    };
}

function changeUserPIN({ userId, currentPIN, newPIN }) {
    const user = getUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const normalizedCurrentPIN = normalizePIN(currentPIN);
    const normalizedNewPIN = normalizePIN(newPIN);

    if (!verifyPIN(normalizedCurrentPIN, user.pin_hash)) {
        throw new Error('Current PIN is incorrect');
    }

    if (normalizedCurrentPIN === normalizedNewPIN) {
        throw new Error('New PIN must be different from the current PIN');
    }

    db.prepare(`
      UPDATE users
      SET pin_hash = ?,
          is_first_login = 0,
          failed_attempts = 0,
          last_login = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(hashPIN(normalizedNewPIN), userId);

    return sanitizeUser(getUserById(userId));
}

function markFirstLoginComplete(userId) {
    db.prepare(`
      UPDATE users
      SET is_first_login = 0,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(userId);

    return sanitizeUser(getUserById(userId));
}

module.exports = {
    authenticateUser,
    changeUserPIN,
    createUserAccount,
    getUserById,
    getUserByUsername,
    markFirstLoginComplete,
    sanitizeUser,
};