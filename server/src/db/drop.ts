import pool from './db';

const drop = async () => {
  await pool.query(`
    DROP TABLE IF EXISTS 
      audit_logs, secrets, project_members, projects, 
      organization_members, organizations, user_sessions, users,
      secret_user_access, rule_template_rules, rule_templates
    CASCADE;
  `);
  console.log('✅ Old tables dropped');
  await pool.end();
};

drop().catch(e => { console.error(e); process.exit(1); });
