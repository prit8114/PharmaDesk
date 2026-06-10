const SCHEMA_QUERIES = [

  // 1. users
  `CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    pin_hash        TEXT NOT NULL,
    role            TEXT,
    full_name       TEXT NOT NULL,
    phone           TEXT,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until    TEXT,
    last_login      TEXT,
    is_first_login  INTEGER NOT NULL DEFAULT 1,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active', 'inactive')),
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT
  );`,

  // 2. settings
  `CREATE TABLE IF NOT EXISTS settings (
    id          INTEGER PRIMARY KEY,
    key         TEXT UNIQUE NOT NULL,
    value       TEXT NOT NULL,
    description TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT
  );`,

  // 3. invoice_sequence
  `CREATE TABLE IF NOT EXISTS invoice_sequence (
    id             INTEGER PRIMARY KEY,
    type           TEXT UNIQUE NOT NULL,
    prefix         TEXT NOT NULL,
    next_value     INTEGER NOT NULL DEFAULT 1,
    length         INTEGER NOT NULL DEFAULT 6,
    financial_year TEXT NOT NULL DEFAULT '2025-26',
    created_at     TEXT DEFAULT (datetime('now')),
    updated_at     TEXT
  );`,

  // 4. suppliers
  `CREATE TABLE IF NOT EXISTS suppliers (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    contact_person  TEXT,
    phone           TEXT NOT NULL,
    email           TEXT,
    address         TEXT,
    gst_number      TEXT,
    drug_license_no TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active', 'inactive')),
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT
  );`,

  // 5. medicines
  `CREATE TABLE IF NOT EXISTS medicines (
    id                    INTEGER PRIMARY KEY,
    name                  TEXT NOT NULL,
    generic_name          TEXT NOT NULL,
    barcode               TEXT UNIQUE,
    category              TEXT,
    hsn_code              TEXT NOT NULL,
    gst_percent           REAL NOT NULL DEFAULT 0,
    schedule              TEXT CHECK(schedule IN ('H', 'H1', 'X')),
    manufacturer          TEXT,
    drug_license_required INTEGER NOT NULL DEFAULT 0,
    box_size              INTEGER NOT NULL DEFAULT 1,
    min_stock_level       INTEGER NOT NULL DEFAULT 0,
    location              TEXT,
    status                TEXT NOT NULL DEFAULT 'active'
                          CHECK(status IN ('active', 'inactive')),
    created_at            TEXT DEFAULT (datetime('now')),
    updated_at            TEXT
  );`,

  // 6. batches
  `CREATE TABLE IF NOT EXISTS batches (
    id               INTEGER PRIMARY KEY,
    medicine_id      INTEGER NOT NULL,
    batch_number     TEXT NOT NULL,
    expiry_date      TEXT NOT NULL,
    manufacture_date TEXT,
    purchase_rate    REAL NOT NULL,
    mrp              REAL NOT NULL,
    quantity         INTEGER NOT NULL DEFAULT 0,
    status           TEXT NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active','near_expiry',
                           'expired','quarantined','disposed')),
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    UNIQUE(medicine_id, batch_number)
  );`,

  // 7. inventory_log
  `CREATE TABLE IF NOT EXISTS inventory_log (
    id           INTEGER PRIMARY KEY,
    medicine_id  INTEGER NOT NULL,
    batch_id     INTEGER NOT NULL,
    type         TEXT NOT NULL CHECK(type IN (
                   'purchase','sale','purchase_return',
                   'sale_return','adjustment','expiry','disposal')),
    quantity     INTEGER NOT NULL,
    reference_id INTEGER,
    reason       TEXT,
    user_id      INTEGER NOT NULL,
    created_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (batch_id)    REFERENCES batches(id),
    FOREIGN KEY (user_id)     REFERENCES users(id)
  );`,

  // 8. patients
  `CREATE TABLE IF NOT EXISTS patients (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    phone         TEXT UNIQUE,
    email         TEXT,
    address       TEXT,
    age           INTEGER,
    gender        TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    doctor_name   TEXT,
    consent_given INTEGER NOT NULL DEFAULT 0,
    consent_date  TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT
  );`,

  // 9. purchases
  `CREATE TABLE IF NOT EXISTS purchases (
    id              INTEGER PRIMARY KEY,
    supplier_id     INTEGER NOT NULL,
    invoice_number  TEXT NOT NULL,
    purchase_date   TEXT NOT NULL,
    total_amount    REAL NOT NULL DEFAULT 0,
    tax_amount      REAL NOT NULL DEFAULT 0,
    cgst_amount     REAL NOT NULL DEFAULT 0,
    sgst_amount     REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    net_amount      REAL NOT NULL DEFAULT 0,
    payment_mode    TEXT NOT NULL DEFAULT 'cash'
                    CHECK(payment_mode IN ('cash','credit','bank')),
    payment_status  TEXT NOT NULL DEFAULT 'paid'
                    CHECK(payment_status IN ('paid','pending')),
    user_id         INTEGER NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (user_id)     REFERENCES users(id),
    UNIQUE(supplier_id, invoice_number)
  );`,

  // 10. purchase_items
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id                  INTEGER PRIMARY KEY,
    purchase_id         INTEGER NOT NULL,
    medicine_id         INTEGER NOT NULL,
    batch_id            INTEGER NOT NULL,
    quantity            INTEGER NOT NULL,
    free_quantity       INTEGER NOT NULL DEFAULT 0,
    purchase_rate       REAL NOT NULL,
    mrp                 REAL NOT NULL,
    gst_percent         REAL NOT NULL DEFAULT 0,
    discount_percentage REAL NOT NULL DEFAULT 0,
    amount              REAL NOT NULL,
    created_at          TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (batch_id)    REFERENCES batches(id)
  );`,

  // 11. bills
  `CREATE TABLE IF NOT EXISTS bills (
    id              INTEGER PRIMARY KEY,
    bill_number     TEXT UNIQUE NOT NULL,
    patient_id      INTEGER,
    patient_name    TEXT,
    doctor_name     TEXT,
    bill_date       TEXT NOT NULL,
    total_amount    REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    taxable_value   REAL NOT NULL DEFAULT 0,
    total_cgst      REAL NOT NULL DEFAULT 0,
    total_sgst      REAL NOT NULL DEFAULT 0,
    total_igst      REAL NOT NULL DEFAULT 0,
    net_amount      REAL NOT NULL DEFAULT 0,
    payment_mode    TEXT NOT NULL
                    CHECK(payment_mode IN ('cash','card','upi','mixed','credit')),
    cash_amount     REAL NOT NULL DEFAULT 0,
    card_amount     REAL NOT NULL DEFAULT 0,
    upi_amount      REAL NOT NULL DEFAULT 0,
    user_id         INTEGER NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (user_id)    REFERENCES users(id)
  );`,

  // 12. bill_items
  `CREATE TABLE IF NOT EXISTS bill_items (
    id                  INTEGER PRIMARY KEY,
    bill_id             INTEGER NOT NULL,
    medicine_id         INTEGER NOT NULL,
    batch_id            INTEGER NOT NULL,
    medicine_name       TEXT NOT NULL,
    batch_number        TEXT NOT NULL,
    hsn_code            TEXT NOT NULL,
    quantity            INTEGER NOT NULL,
    mrp                 REAL NOT NULL,
    discount_percentage REAL NOT NULL DEFAULT 0,
    taxable_value       REAL NOT NULL,
    gst_percent         REAL NOT NULL DEFAULT 0,
    cgst_percent        REAL NOT NULL DEFAULT 0,
    cgst_amount         REAL NOT NULL DEFAULT 0,
    sgst_percent        REAL NOT NULL DEFAULT 0,
    sgst_amount         REAL NOT NULL DEFAULT 0,
    igst_percent        REAL NOT NULL DEFAULT 0,
    igst_amount         REAL NOT NULL DEFAULT 0,
    amount              REAL NOT NULL,
    created_at          TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bill_id)     REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (batch_id)    REFERENCES batches(id)
  );`,

  // 13. sale_returns
  `CREATE TABLE IF NOT EXISTS sale_returns (
    id            INTEGER PRIMARY KEY,
    bill_id       INTEGER NOT NULL,
    return_number TEXT UNIQUE NOT NULL,
    return_date   TEXT NOT NULL,
    patient_id    INTEGER,
    total_amount  REAL NOT NULL DEFAULT 0,
    tax_amount    REAL NOT NULL DEFAULT 0,
    refund_amount REAL NOT NULL DEFAULT 0,
    payment_mode  TEXT NOT NULL
                  CHECK(payment_mode IN ('cash','card','upi','credit')),
    reason        TEXT,
    user_id       INTEGER NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT,
    FOREIGN KEY (bill_id)    REFERENCES bills(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (user_id)    REFERENCES users(id)
  );`,

  // 14. sale_return_items
  `CREATE TABLE IF NOT EXISTS sale_return_items (
    id              INTEGER PRIMARY KEY,
    sale_return_id  INTEGER NOT NULL,
    bill_item_id    INTEGER NOT NULL,
    medicine_id     INTEGER NOT NULL,
    batch_id        INTEGER NOT NULL,
    quantity        INTEGER NOT NULL,
    mrp             REAL NOT NULL,
    taxable_value   REAL NOT NULL,
    cgst_amount     REAL NOT NULL DEFAULT 0,
    sgst_amount     REAL NOT NULL DEFAULT 0,
    refund_amount   REAL NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sale_return_id) REFERENCES sale_returns(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_item_id)   REFERENCES bill_items(id),
    FOREIGN KEY (medicine_id)    REFERENCES medicines(id),
    FOREIGN KEY (batch_id)       REFERENCES batches(id)
  );`,

  // 15. purchase_returns
  `CREATE TABLE IF NOT EXISTS purchase_returns (
    id            INTEGER PRIMARY KEY,
    purchase_id   INTEGER NOT NULL,
    supplier_id   INTEGER NOT NULL,
    return_number TEXT UNIQUE NOT NULL,
    return_date   TEXT NOT NULL,
    total_amount  REAL NOT NULL DEFAULT 0,
    tax_amount    REAL NOT NULL DEFAULT 0,
    refund_amount REAL NOT NULL DEFAULT 0,
    reason        TEXT,
    user_id       INTEGER NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (user_id)     REFERENCES users(id)
  );`,

  // 16. purchase_return_items
  `CREATE TABLE IF NOT EXISTS purchase_return_items (
    id                 INTEGER PRIMARY KEY,
    purchase_return_id INTEGER NOT NULL,
    medicine_id        INTEGER NOT NULL,
    batch_id           INTEGER NOT NULL,
    quantity           INTEGER NOT NULL,
    purchase_rate      REAL NOT NULL,
    gst_percent        REAL NOT NULL DEFAULT 0,
    amount             REAL NOT NULL,
    created_at         TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id)
                                     ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (batch_id)    REFERENCES batches(id)
  );`,

  // 17. drug_register
  `CREATE TABLE IF NOT EXISTS drug_register (
    id                INTEGER PRIMARY KEY,
    bill_id           INTEGER NOT NULL,
    medicine_id       INTEGER NOT NULL,
    batch_id          INTEGER NOT NULL,
    patient_name      TEXT NOT NULL,
    patient_address   TEXT,
    doctor_name       TEXT NOT NULL,
    doctor_reg_number TEXT,
    prescription_date TEXT NOT NULL,
    prescription_ref  TEXT NOT NULL,
    quantity          INTEGER NOT NULL,
    dispensing_date   TEXT NOT NULL,
    dispensed_by      INTEGER NOT NULL,
    created_at        TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bill_id)      REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id)  REFERENCES medicines(id),
    FOREIGN KEY (batch_id)     REFERENCES batches(id),
    FOREIGN KEY (dispensed_by) REFERENCES users(id)
  );`,

  // 18. day_closings
  `CREATE TABLE IF NOT EXISTS day_closings (
    id                    INTEGER PRIMARY KEY,
    closing_date          TEXT UNIQUE NOT NULL,
    opening_balance       REAL NOT NULL DEFAULT 0,
    total_sales           REAL NOT NULL DEFAULT 0,
    cash_sales            REAL NOT NULL DEFAULT 0,
    card_sales            REAL NOT NULL DEFAULT 0,
    upi_sales             REAL NOT NULL DEFAULT 0,
    total_purchases       REAL NOT NULL DEFAULT 0,
    total_sales_returns   REAL NOT NULL DEFAULT 0,
    total_purchase_returns REAL NOT NULL DEFAULT 0,
    total_cgst            REAL NOT NULL DEFAULT 0,
    total_sgst            REAL NOT NULL DEFAULT 0,
    total_bills           INTEGER NOT NULL DEFAULT 0,
    total_items_sold      INTEGER NOT NULL DEFAULT 0,
    cash_in_hand          REAL NOT NULL DEFAULT 0,
    closing_balance       REAL NOT NULL DEFAULT 0,
    cash_difference       REAL NOT NULL DEFAULT 0,
    backup_path           TEXT,
    status                TEXT NOT NULL DEFAULT 'open'
                          CHECK(status IN ('open','closed')),
    user_id               INTEGER NOT NULL,
    created_at            TEXT DEFAULT (datetime('now')),
    updated_at            TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  // 19. audit_logs
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    action     TEXT NOT NULL,
    module     TEXT NOT NULL,
    record_id  INTEGER,
    details    TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  // 20. notification_log
  `CREATE TABLE IF NOT EXISTS notification_log (
    id         INTEGER PRIMARY KEY,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'unread'
               CHECK(status IN ('unread','read')),
    user_id    INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`,

  // 21. backup_log
  `CREATE TABLE IF NOT EXISTS backup_log (
    id          INTEGER PRIMARY KEY,
    backup_date TEXT NOT NULL,
    backup_type TEXT NOT NULL DEFAULT 'manual'
                CHECK(backup_type IN ('manual','auto','dayclose')),
    file_name   TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    file_size   INTEGER NOT NULL DEFAULT 0,
    checksum    TEXT,
    verified    INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL CHECK(status IN ('success','failed')),
    user_id     INTEGER,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`

];

module.exports = {
  SCHEMA_QUERIES,
  schema: SCHEMA_QUERIES.join('\n\n')
};