import pool from '../db/db';

export async function notifyRestrictedAccess(projectId: string, userId: string, secretKey: string, env: string) {
  try {
    // 1. Fetch webhooks for this project
    const webhooksRes = await pool.query(
      'SELECT url FROM webhooks WHERE project_id = $1 AND is_active = true',
      [projectId]
    );

    if (webhooksRes.rows.length === 0) return;

    // 2. Fetch user details for the alert
    const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    const message = {
      text: `🛡️ *Synkrypt Security Alert: Restricted Secret Access*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🛡️ *Synkrypt Governance: Restricted Access Detected*`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Actor:* ${user.name}\n${user.email}` },
            { type: "mrkdwn", text: `*Secret:* \`${secretKey}\`` },
            { type: "mrkdwn", text: `*Environment:* \`${env.toUpperCase()}\`` },
            { type: "mrkdwn", text: `*Status:* Decrypted & Injected` }
          ]
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `⚠️ This secret is marked as *Restricted*. Audit trail updated.` }
          ]
        }
      ]
    };

    // 3. Send to all configured webhooks
    for (const webhook of webhooksRes.rows) {
      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      }).catch(err => console.error('Webhook notification failed:', err));
    }

  } catch (err) {
    console.error('Notifier failed:', err);
  }
}
