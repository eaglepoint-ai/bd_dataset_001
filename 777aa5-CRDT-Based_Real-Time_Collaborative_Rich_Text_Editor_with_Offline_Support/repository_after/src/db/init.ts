/**
 * Database Initialization
 * Runs schema.sql to set up database tables and indexes
 */

import { pool } from './connection';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Initializes the database schema
 * Reads schema.sql and executes it
 */
export async function initializeDatabase(): Promise<void> {
  console.log('📊 Initializing database schema...');

  try {
    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  }
}

/**
 * Checks if database tables exist
 */
export async function checkDatabaseSchema(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documents'
      );
    `);

    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking database schema:', error);
    return false;
  }
}
