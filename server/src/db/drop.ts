import pool from './db';

const drop = async () => {
  await pool.query(`
    DROP TABLE IF EXISTS 
      audit_logs, cluster_sync_configs, secrets, 
      project_members, projects, access_presets,
      user_sessions, users,
      organization_members, organizations, 
      secret_user_access, rule_template_rules, rule_templates
    CASCADE;
  `);
  console.log(' All tables dropped successfully');
  await pool.end();
};

drop().catch(e => { console.error(e); process.exit(1); });
