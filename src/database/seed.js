/**
 * src/database/seed.js
 *
 * Inserts default data into the database on first run.
 * Safe to call on every startup — checks before inserting.
 * Never overwrites existing data.
 */

const crypto = require('crypto');
const { db } = require('./database');

// ── Helper ────────────────────────────────────────────────────
function hashPIN(pin) {
  return crypto.createHash('sha256').update(pin.toString()).digest('hex');
}

function tableIsEmpty(tableName) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
  return row.count === 0;
}

// ── 1. Seed Admin User ────────────────────────────────────────
function seedAdminUser() {
  if (!tableIsEmpty('users')) {
    console.log('⏭  Users already seeded — skipping');
    return;
  }

  db.prepare(`
    INSERT INTO users (username, pin_hash, role, full_name, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'admin',
    hashPIN('1234'),   // default PIN — forced to change on first login
    'admin',
    'Administrator',
    'active'
  );

  console.log('✅ Admin user created (username: admin, PIN: 1234)');
}

// ── 2. Seed Settings ──────────────────────────────────────────
function seedSettings() {
  if (!tableIsEmpty('settings')) {
    console.log('⏭  Settings already seeded — skipping');
    return;
  }

  const defaults = [
    // Pharmacy Details
    ['pharmacy_name',         '',        'Pharmacy name shown on invoices'],
    ['pharmacy_address',      '',        'Full address shown on invoices'],
    ['pharmacy_phone',        '',        'Contact number shown on invoices'],
    ['pharmacy_email',        '',        'Email address'],
    ['pharmacy_logo',         '',        'Path to logo image for invoices'],

    // Legal
    ['drug_license_number',   '',        'Drug licence number — printed on all invoices'],
    ['drug_license_expiry',   '',        'Drug licence expiry date (YYYY-MM-DD)'],
    ['gst_number',            '',        'GSTIN — printed on all invoices'],
    ['gst_state_code',        '',        'State code for GST (e.g. 27 for Maharashtra)'],

    // Invoice
    ['invoice_prefix',        'INV',     'Prefix for invoice numbers'],
    ['financial_year',        '2025-26', 'Current financial year'],

    // Operations
    ['low_stock_threshold',   '10',      'Alert when stock falls below this number'],
    ['near_expiry_days',      '90',      'Alert when expiry is within this many days'],
    ['backup_interval_hours', '4',       'Auto backup every X hours'],
    ['backup_path_primary',   '',        'Primary backup folder path'],
    ['backup_path_secondary', '',        'Secondary backup folder path (USB/network)'],

    // System
    ['is_first_run',          '1',       'Shows setup wizard if 1'],
    ['force_pin_change',      '1',       'Forces admin to change default PIN if 1'],
    ['app_version',           '1.0.0',   'Current app version'],
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
