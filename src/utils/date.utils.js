// date.utils.js - date formatting, YYYY-MM-DD parsing, financial year calc, expiry checks
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
    if (format === 'DD-MM-YYYY') return `${dd}-${mm}-${yyyy}`;
    
    return d.toISOString();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function getFinancialYear(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    if (month >= 4) {
        return `${year}-${String(year + 1).slice(2)}`;
    } else {
        return `${year - 1}-${String(year).slice(2)}`;
    }
}

function isExpired(expiryDate) {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    return exp < today;
}

function getDaysToExpiry(expiryDate) {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
    formatDate,
    parseDate,
    getFinancialYear,
    isExpired,
    getDaysToExpiry
};
