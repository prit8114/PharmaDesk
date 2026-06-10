// hash.utils.js - general purpose (SHA-256 for checksums, used by backup module)
const crypto = require('crypto');

function generateChecksum(filePath) {
    const fs = require('fs');
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

function generateHashString(data) {
    return crypto.createHash('sha256').update(String(data)).digest('hex');
}

module.exports = {
    generateChecksum,
    generateHashString
};
