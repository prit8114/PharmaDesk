/**
 * database/database.js
 * 
 * Opens the SQLite database, applies all safety pragmas,
 * and runs the schema + migrations on first launch.
 * 
 * Every module imports this file to get the db instance.
 * This file is the ONLY place the database connection is created.
 */

const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');
const { SCHEMA_QUERIES } = require('./schema');

// ── Path Setup ────────────────────────────────────────────────
// In production: AppData/Roaming/PharmacyPMS/data/main.db
// In development: project root /data/main.db

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'main.db');

// ── Ensure data folder exists ─────────────────────────────────
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// ── Open Database ─────────────────────────────────────────────
let db;

try {
    db = new Database(DB_PATH, {
        // verbose: console.log  // uncomment to log every SQL query during dev
    });
} catch (err) {
    console.error('FATAL: Could not open database at', DB_PATH);
    console.error(err.message);
    process.exit(1);  // cannot run without a database
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

// ── Run Schema ────────────────────────────────────────────────
// Creates all tables if they do not exist yet
// Safe to run on every startup — IF NOT EXISTS prevents duplicates
function runSchema() {
    try {
        const runAllTables = db.transaction(() => {
            for (const query of SCHEMA_QUERIES) {
                db.prepare(query).run();
            }
        });
        runAllTables();
        console.log('✅ Schema applied successfully');
    } catch (err) {
        console.error('FATAL: Schema creation failed');
        console.error(err.message);
        process.exit(1);
    }
}

// ── Integrity Check ───────────────────────────────────────────
// Runs on every startup to detect corruption early
function runIntegrityCheck() {
    try {
        const result = db.pragma('integrity_check');
        if (result[0]['integrity_check'] !== 'ok') {
            console.error('FATAL: Database integrity check failed');
            console.error(result);
            // Do not exit — let the app show a recovery screen
            return false;
        }
        console.log('✅ Integrity check passed');
        return true;
    } catch (err) {
        console.error('Integrity check error:', err.message);
        return false;
    }
}

// ── Export ────────────────────────────────────────────────────
// Assign properties directly to module.exports to avoid reassigning the exports object.
// This ensures circular dependencies (like in seed.js) resolve correctly with the populated db instance.
module.exports.db = db;
module.exports.DB_PATH = DB_PATH;
module.exports.DB_DIR = DB_DIR;
module.exports.isHealthy = false;

// ── Startup Sequence ──────────────────────────────────────────
runSchema();
const isHealthy = runIntegrityCheck();
module.exports.isHealthy = isHealthy;

// ── Run Seed ──────────────────────────────────────────────────
const { runSeed } = require('./seed');
runSeed();
