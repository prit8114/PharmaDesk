// src/database/migrations/001_initial_schema.js
const { SCHEMA_QUERIES } = require('../schema');

function getTableColumns(db, tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function tableExists(db, tableName) {
  return db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(tableName) !== undefined;
}

function ensureColumn(db, tableName, columnName, columnDefinition) {
  const columns = getTableColumns(db, tableName);
  if (!columns.includes(columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`).run();
  }
}

module.exports = {
  version: 1,
  name: 'initial_schema',
  up(db) {
    // Run all CREATE TABLE IF NOT EXISTS statements
    for (const query of SCHEMA_QUERIES) {
      db.prepare(query).run();
    }

    // Safely ensure missing columns exist for older existing databases
    if (tableExists(db, 'users')) {
      ensureColumn(db, 'users', 'pin_hash', "pin_hash TEXT NOT NULL DEFAULT ''");
      ensureColumn(db, 'users', 'role', 'role TEXT');
      ensureColumn(db, 'users', 'full_name', "full_name TEXT NOT NULL DEFAULT ''");
      ensureColumn(db, 'users', 'phone', 'phone TEXT');
      ensureColumn(db, 'users', 'failed_attempts', 'failed_attempts INTEGER NOT NULL DEFAULT 0');
      ensureColumn(db, 'users', 'locked_until', 'locked_until TEXT');
      ensureColumn(db, 'users', 'last_login', 'last_login TEXT');
      ensureColumn(db, 'users', 'is_first_login', 'is_first_login INTEGER NOT NULL DEFAULT 1');
      ensureColumn(db, 'users', 'status', "status TEXT NOT NULL DEFAULT 'active'");
      ensureColumn(db, 'users', 'created_at', "created_at TEXT DEFAULT (datetime('now'))");
      ensureColumn(db, 'users', 'updated_at', 'updated_at TEXT');

      db.prepare(`
        UPDATE users
        SET
          full_name = COALESCE(NULLIF(full_name, ''), 'Administrator'),
          status = 'active',
          is_first_login = COALESCE(is_first_login, 1)
        WHERE username = 'admin'
      `).run();
    }
  }
};
