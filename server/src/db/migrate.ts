import fs from 'fs';
import path from 'path';
import pool from './db';

const migrate = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Running migrations...');
    await pool.query(schema);

    // Incremental fixes for existing tables
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='org_id') THEN
          ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    console.log(' Migrations completed successfully');
  } catch (err) {
    console.error(' Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
