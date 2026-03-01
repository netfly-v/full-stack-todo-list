import { promises as fs } from 'fs';
import path from 'path';
import pool from './db';

const migrationsDir = path.join(process.cwd(), 'migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const result = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((row) => row.filename));
};

const runSingleMigration = async (filename: string, sql: string) => {
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

export const runMigrations = async () => {
  await ensureMigrationsTable();

  const files = await fs.readdir(migrationsDir);
  const migrations = files.filter((file) => file.endsWith('.sql')).sort();
  const applied = await getAppliedMigrations();

  for (const filename of migrations) {
    if (applied.has(filename)) {
      continue;
    }

    const fullPath = path.join(migrationsDir, filename);
    const sql = await fs.readFile(fullPath, 'utf8');
    await runSingleMigration(filename, sql);
  }
};

const entryFile = process.argv[1] ?? '';
const isDirectRun = entryFile.endsWith('migrate.ts') || entryFile.endsWith('migrate.js');

if (isDirectRun) {
  runMigrations()
    .then(() => {
      console.log('✅ Migrations applied');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
