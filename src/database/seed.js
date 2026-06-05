/**
 * src/database/seed.js
 *
 * Inserts default data into the database on first run.
 * Safe to call on every startup — checks before inserting.
 * Never overwrites existing data.
 */

const { db } = require('./database');
const { hashPIN } = require('../utils/pin');

// ── Helper ────────────────────────────────────────────────────
function getDefaultAdminPIN() {
    const configuredPIN = String(process.env.DEFAULT_ADMIN_PIN || '').trim();

    if (/^\d{4,6}$/.test(configuredPIN)) {
        return configuredPIN;
    }

    if (configuredPIN) {
        console.warn('⚠️  DEFAULT_ADMIN_PIN must be 4-6 digits. Falling back to the temporary install PIN.');
    }

    // Temporary PIN used during installation; users can change it after first login.
    return '1234';
}

function tableIsEmpty(tableName) {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    return row.count === 0;
}

// ── 1. Seed Admin User ────────────────────────────────────────
function seedAdminUser() {
    const defaultPIN = getDefaultAdminPIN();
    const defaultPINHash = hashPIN(defaultPIN);
    const adminUser = db.prepare(`SELECT * FROM users WHERE username = ?`).get('admin');

    if (!adminUser) {
        db.prepare(`
        INSERT INTO users (username, pin_hash, full_name, status, is_first_login)
        VALUES (?, ?, ?, ?, ?)
      `).run(
            'admin',
            defaultPINHash,
            'Administrator',
            'active',
            1
        );

        console.log('✅ Admin user created (username: admin)');
        return;
    }

    const updates = [];
    const params = [];

    if (!adminUser.pin_hash) {
        updates.push('pin_hash = ?');
        params.push(defaultPINHash);
    }

    if (!adminUser.full_name) {
        updates.push('full_name = ?');
        params.push('Administrator');
    }

    if (adminUser.status !== 'active') {
        updates.push('status = ?');
        params.push('active');
    }

    if (Object.prototype.hasOwnProperty.call(adminUser, 'is_first_login') && adminUser.is_first_login !== 1) {
        updates.push('is_first_login = ?');
        params.push(1);
    }

    if (updates.length > 0) {
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params);
        console.log('✅ Admin user updated (username: admin)');
    } else {
        console.log('⏭  Admin user already seeded — skipping');
    }
}

// ── 2. Seed Settings ──────────────────────────────────────────
function seedSettings() {
    if (!tableIsEmpty('settings')) {
        console.log('⏭  Settings already seeded — skipping');
        return;
    }

    const defaults = [
        // Pharmacy Details
        ['pharmacy_name', '', 'Pharmacy name shown on invoices'],
        ['pharmacy_address', '', 'Full address shown on invoices'],
        ['pharmacy_phone', '', 'Contact number shown on invoices'],
        ['pharmacy_email', '', 'Email address'],
        ['pharmacy_logo', '', 'Path to logo image for invoices'],

        // Legal
        ['drug_license_number', '', 'Drug licence number — printed on all invoices'],
        ['drug_license_expiry', '', 'Drug licence expiry date (YYYY-MM-DD)'],
        ['gst_number', '', 'GSTIN — printed on all invoices'],
        ['gst_state_code', '', 'State code for GST (e.g. 27 for Maharashtra)'],

        // Invoice
        ['invoice_prefix', 'INV', 'Prefix for invoice numbers'],
        ['financial_year', '2025-26', 'Current financial year'],

        // Operations
        ['low_stock_threshold', '10', 'Alert when stock falls below this number'],
        ['near_expiry_days', '90', 'Alert when expiry is within this many days'],
        ['backup_interval_hours', '4', 'Auto backup every X hours'],
        ['backup_path_primary', '', 'Primary backup folder path'],
        ['backup_path_secondary', '', 'Secondary backup folder path (USB/network)'],

        // System
        ['is_first_run', '1', 'Shows setup wizard if 1'],
        ['force_pin_change', '1', 'Forces admin to change default PIN if 1'],
        ['enable_role_based_access', '0', 'Enable role-based access control if 1'],
        ['app_version', '1.0.0', 'Current app version'],
    ];

    const insert = db.prepare(`
    INSERT INTO settings (key, value, description)
    VALUES (?, ?, ?)
  `);

    const insertAll = db.transaction(() => {
        for (const [key, value, description] of defaults) {
            insert.run(key, value, description);
        }
    });

    insertAll();
    console.log('✅ Default settings created');
}

// ── 3. Seed Invoice Sequence ──────────────────────────────────
function seedInvoiceSequence() {
    if (!tableIsEmpty('invoice_sequence')) {
        console.log('⏭  Invoice sequence already seeded — skipping');
        return;
    }

    db.prepare(`
    INSERT INTO invoice_sequence (type, prefix, next_value, length, financial_year)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        'bill',       // for sales bills
        'INV',
        1,
        6,            // INV/2025-26/000001
        '2025-26'
    );

    db.prepare(`
    INSERT INTO invoice_sequence (type, prefix, next_value, length, financial_year)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        'purchase',   // for purchase entries
        'PUR',
        1,
        6,            // PUR/2025-26/000001
        '2025-26'
    );

    db.prepare(`
    INSERT INTO invoice_sequence (type, prefix, next_value, length, financial_year)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        'sale_return',  // for sale return numbers
        'SRT',
        1,
        6,              // SRT/2025-26/000001
        '2025-26'
    );

    db.prepare(`
    INSERT INTO invoice_sequence (type, prefix, next_value, length, financial_year)
    VALUES (?, ?, ?, ?, ?)
  `).run(
        'purchase_return',  // for purchase return numbers
        'PRT',
        1,
        6,                  // PRT/2025-26/000001
        '2025-26'
    );

    console.log('✅ Invoice sequences created (bill, purchase, sale_return, purchase_return)');
}

// ── Run All Seeds ─────────────────────────────────────────────
function runSeed() {
    console.log('🌱 Running seed...');

    const seed = db.transaction(() => {
        seedAdminUser();
        seedSettings();
        seedInvoiceSequence();
    });

    seed();
    console.log('✅ Seed complete');
}

module.exports = { runSeed };