import fs from 'fs';
import path from 'path';
import pool from './db';

const migrate = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('🚀 Running migrations...');
    await pool.query(schema);
    console.log(' Migrations completed successfully');
  } catch (err) {
    console.error(' Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
