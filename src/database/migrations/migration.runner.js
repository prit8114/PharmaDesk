// src/database/migrations/migration.runner.js
const MIGRATIONS = [
  require('./001_initial_schema'),
  require('./002_indexes')
];

function runMigrations(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version   INTEGER PRIMARY KEY,
      name      TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `).run();

  for (const migration of MIGRATIONS) {
    const already = db.prepare(
      `SELECT 1 FROM schema_migrations WHERE version = ?`
    ).get(migration.version);

    if (!already) {
      db.transaction(() => {
        migration.up(db);
        db.prepare(
          `INSERT INTO schema_migrations (version, name) VALUES (?, ?)`
        ).run(migration.version, migration.name);
      })();
      console.log(`✅ Migration ${migration.version}: ${migration.name}`);
    }
  }
}

module.exports = { runMigrations };
