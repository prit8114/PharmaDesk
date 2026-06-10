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
const { SCHEMA_QUERIES } = require('./schema');

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

// ── Schema Migrations ─────────────────────────────────────────
const { runMigrations } = require('./migrations/migration.runner');

function runSchema() {
  try {
    runMigrations(db);
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
