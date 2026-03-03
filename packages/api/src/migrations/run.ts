import { getClient } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const client = await getClient();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Ensure uuid-ossp extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Get already executed migrations
    const executed = await client.query('SELECT name FROM _migrations ORDER BY id');
    const executedNames = new Set(executed.rows.map((r: any) => r.name));

    // Read migration files in order
    const migrationsDir = path.join(__dirname, 'sql');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`⏭  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`▶  Running ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ ${file} executed successfully`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ ${file} failed:`, err);
        throw err;
      }
    }

    console.log('All migrations completed!');
  } finally {
    client.release();
  }

  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
