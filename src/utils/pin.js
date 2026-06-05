const crypto = require('node:crypto');

const HASH_PREFIX = 'scrypt';
const SCRYPT_PARAMS = {
    N: 16384,
    r: 8,
    p: 1,
    keyLength: 64,
};

function normalizePIN(pin) {
    const value = String(pin ?? '').trim();

    if (!/^\d{4,6}$/.test(value)) {
        throw new Error('PIN must be 4-6 digits');
    }

    return value;
}

function hashPIN(pin) {
    const normalizedPIN = normalizePIN(pin);
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(normalizedPIN, salt, SCRYPT_PARAMS.keyLength, {
        N: SCRYPT_PARAMS.N,
        r: SCRYPT_PARAMS.r,
        p: SCRYPT_PARAMS.p,
    }).toString('hex');

    return [
        HASH_PREFIX,
        SCRYPT_PARAMS.N,
        SCRYPT_PARAMS.r,
        SCRYPT_PARAMS.p,
        salt,
        derivedKey,
    ].join('$');
}

function verifyPIN(pin, storedHash) {
    const normalizedPIN = normalizePIN(pin);
    const encodedHash = String(storedHash || '').trim();

    if (!encodedHash) {
        return false;
    }

    if (encodedHash.startsWith(`${HASH_PREFIX}$`)) {
        const [, nValue, rValue, pValue, salt, expectedDerivedKey] = encodedHash.split('$');

        if (!nValue || !rValue || !pValue || !salt || !expectedDerivedKey) {
            return false;
        }

        const derivedKey = crypto.scryptSync(normalizedPIN, salt, expectedDerivedKey.length / 2, {
            N: Number(nValue),
            r: Number(rValue),
            p: Number(pValue),
        }).toString('hex');

        return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(expectedDerivedKey, 'hex'));
    }

    // Backward compatibility for existing SHA-256 hashes already stored in the database.
    return crypto.createHash('sha256').update(normalizedPIN).digest('hex') === encodedHash;
}

module.exports = {
    hashPIN,
    normalizePIN,
    verifyPIN,
};