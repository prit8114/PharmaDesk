// src/database/migrations/002_indexes.js
module.exports = {
  version: 2,
  name: 'add_indexes',
  up(db) {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_batches_medicine ON batches(medicine_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_inventory_log_med ON inventory_log(medicine_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_log(status)`).run();
  }
};
