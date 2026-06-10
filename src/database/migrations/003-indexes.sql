-- 003-indexes.sql
-- Add indexes for performance optimization

CREATE INDEX IF NOT EXISTS idx_medicines_name    ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_batches_medicine  ON batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry    ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_status    ON batches(status);
CREATE INDEX IF NOT EXISTS idx_bills_date        ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill   ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date    ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_med ON inventory_log(medicine_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_log(status);
