// validate.utils.js - GSTIN format (15 chars), PIN format, phone format, HSN format

function isValidGSTIN(gstin) {
    if (!gstin) return false;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
}

function isValidPIN(pin) {
    if (!pin) return false;
    const pinRegex = /^[0-9]{4,6}$/;
    return pinRegex.test(String(pin));
}

function isValidPhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^[0-9]{10}$/; // Basic 10-digit phone number check
    return phoneRegex.test(String(phone).replace(/\D/g, ''));
}

function isValidHSN(hsn) {
    if (!hsn) return false;
    const hsnRegex = /^[0-9]{4,8}$/;
    return hsnRegex.test(String(hsn));
}

module.exports = {
    isValidGSTIN,
    isValidPIN,
    isValidPhone,
    isValidHSN
};
