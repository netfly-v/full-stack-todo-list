import pool from '../db';
import { runMigrations } from '../migrate';

/**
 * Setup test database
 * This runs before all tests
 */
export async function setupTestDb() {
  await runMigrations();
  console.log('Test database setup complete');
}

/**
 * Clean up test database
 * This runs after all tests
 */
export async function teardownTestDb() {
  await pool.query('TRUNCATE TABLE todos, users RESTART IDENTITY CASCADE');
  await pool.end();
  console.log('Test database cleanup complete');
}

/**
 * Clear all data between tests
 */
export async function clearTestData() {
  await pool.query('TRUNCATE TABLE todos, users RESTART IDENTITY CASCADE');
}
