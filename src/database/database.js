/**
 * database/database.js
 *
 * Opens the SQLite database, applies all safety pragmas,
 * runs schema creation and migration checks on startup.
 *
 * Every module imports this file to get the db instance.
 * This file is the ONLY place the database connection is created.
 */

// ── Environment Variables ─────────────────────────────────────
// Load .env FIRST, before anything else reads process.env
require('dotenv').config();

const Database = require('better-sqlite3');
const path     = require('node:path');
const fs       = require('node:fs');
const { SCHEMA_QUERIES, SCHEMA_VERSION } = require('./schema');

// ── Path Setup ────────────────────────────────────────────────
// In production: AppData/Roaming/PharmacyPMS/data/main.db
// In development: project root /data/main.db

const isDev = process.env.NODE_ENV !== 'production';

const DB_DIR = isDev
  ? path.join(__dirname, '../../data')
  : path.join(require('electron').app.getPath('userData'), 'data');

const DB_PATH = path.join(DB_DIR, 'main.db');

// ── Ensure data folder exists ─────────────────────────────────
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ── Open Database ─────────────────────────────────────────────
let db;

try {
  db = new Database(DB_PATH);
} catch (err) {
  console.error('FATAL: Could not open database at', DB_PATH);
  console.error(err.message);
  process.exit(1);
}

// ── Safety Pragmas ────────────────────────────────────────────
// MUST run before any queries
try {
  db.pragma('journal_mode = WAL');    // crash safety
  db.pragma('foreign_keys = ON');     // enforce all FK constraints
  db.pragma('synchronous = NORMAL');  // speed + safety balance
  db.pragma('cache_size = -64000');   // 64MB cache
  db.pragma('temp_store = MEMORY');   // temp tables in memory
  db.pragma('mmap_size = 268435456'); // 256MB memory-mapped I/O
} catch (err) {
  console.error('FATAL: Could not apply database pragmas');
  console.error(err.message);
  process.exit(1);
}

// ── Schema Migration Check (Issue #5) ─────────────────────────
// SQLite's user_version pragma stores an integer we control.
// 0 = fresh / unknown, anything else = a schema version we set.
function getTableColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function tableExists(tableName) {
  return db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(tableName) !== undefined;
}

function ensureColumn(tableName, columnName, columnDefinition) {
  const columns = getTableColumns(tableName);

  if (!columns.includes(columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`).run();
    return true;
  }

  return false;
}

function migrateUsersTable() {
  if (!tableExists('users')) {
    return;
  }

  const migration = db.transaction(() => {
    ensureColumn('users', 'pin_hash', "pin_hash TEXT NOT NULL DEFAULT ''");
    ensureColumn('users', 'role', 'role TEXT');
    ensureColumn('users', 'full_name', "full_name TEXT NOT NULL DEFAULT ''");
    ensureColumn('users', 'phone', 'phone TEXT');
    ensureColumn('users', 'failed_attempts', 'failed_attempts INTEGER NOT NULL DEFAULT 0');
    ensureColumn('users', 'locked_until', 'locked_until TEXT');
    ensureColumn('users', 'last_login', 'last_login TEXT');
    ensureColumn('users', 'is_first_login', 'is_first_login INTEGER NOT NULL DEFAULT 1');
    ensureColumn('users', 'status', "status TEXT NOT NULL DEFAULT 'active'");
    ensureColumn('users', 'created_at', "created_at TEXT DEFAULT (datetime('now'))");
    ensureColumn('users', 'updated_at', 'updated_at TEXT');

    db.prepare(`
      UPDATE users
      SET
        full_name = COALESCE(NULLIF(full_name, ''), 'Administrator'),
        status = 'active',
        is_first_login = COALESCE(is_first_login, 1)
      WHERE username = 'admin'
    `).run();
  });

  migration();
}

function runSchema() {
  try {
    const currentVersion = db.pragma('user_version', { simple: true });

    if (currentVersion === 0) {
      // Fresh database — create all tables and stamp the version
      console.log('🆕 Fresh database detected — creating schema...');
      const runAllTables = db.transaction(() => {
        for (const query of SCHEMA_QUERIES) {
          db.prepare(query).run();
        }
      });
      runAllTables();
      migrateUsersTable();
      // Stamp the schema version after a successful creation and migration
      db.pragma(`user_version = ${SCHEMA_VERSION}`);
      console.log(`✅ Schema v${SCHEMA_VERSION} applied successfully`);

    } else if (currentVersion < SCHEMA_VERSION) {
      // Existing DB with an older schema — migrations needed
      console.warn(`⚠️  Schema mismatch: DB is v${currentVersion}, app expects v${SCHEMA_VERSION}`);
      migrateUsersTable();
      db.pragma(`user_version = ${SCHEMA_VERSION}`);
      console.log(`✅ Schema migrated to v${SCHEMA_VERSION}`);

    } else if (currentVersion === SCHEMA_VERSION) {
      migrateUsersTable();
      console.log(`✅ Schema v${SCHEMA_VERSION} — up to date`);

    } else {
      // DB version is newer than the app — downgrade scenario
      console.warn(`⚠️  DB schema v${currentVersion} is newer than app schema v${SCHEMA_VERSION}`);
      console.warn('   Update the app to avoid compatibility issues.');
    }

  } catch (err) {
    console.error('FATAL: Schema creation/migration failed');
    console.error(err.message);
    process.exit(1);
  }
}

// ── Integrity Check ───────────────────────────────────────────
function runIntegrityCheck() {
  try {
    const result = db.pragma('integrity_check');
    if (result[0]['integrity_check'] !== 'ok') {
      console.error('FATAL: Database integrity check failed');
      console.error(result);
      return false;
    }
    console.log('✅ Integrity check passed');
    return true;
  } catch (err) {
    console.error('Integrity check error:', err.message);
    return false;
  }
}

// ── Export FIRST ──────────────────────────────────────────────
// Must happen BEFORE requiring seed.js to avoid circular dependency
// (seed.js requires database.js, so db must already be exported)
module.exports.db      = db;
module.exports.DB_PATH = DB_PATH;
module.exports.DB_DIR  = DB_DIR;
module.exports.isHealthy = false;

// ── Startup Sequence ──────────────────────────────────────────
runSchema();
const isHealthy = runIntegrityCheck();
module.exports.isHealthy = isHealthy;

// ── Run Seed ──────────────────────────────────────────────────
const { runSeed } = require('./seed');
runSeed();
