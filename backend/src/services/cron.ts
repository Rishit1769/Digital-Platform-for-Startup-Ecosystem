import cron from 'node-cron';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2/promise';

export const initCronJobs = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily ecosystem snapshot cron...');
      const date = new Date().toISOString().split('T')[0];

      const [u] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM users');
      const [s] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startups');
      const [m] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM meetings');
      const [i] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM ideas');
      const [con] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startup_members');

      await pool.query(
        'INSERT INTO ecosystem_snapshots (snapshot_date, total_users, total_startups, total_meetings, total_ideas, total_connections) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_users=VALUES(total_users)',
        [date, u[0].c, s[0].c, m[0].c, i[0].c, con[0].c]
      );
      
      console.log('Ecosystem snapshot saved.');
    } catch (err) {
      console.error('Error running daily cron:', err);
    }
  });

  // Run every 6 hours for GitHub cache
  cron.schedule('0 */6 * * *', async () => {
    try {
       console.log('Running GitHub cache refresh...');
       const [startups] = await pool.query<RowDataPacket[]>('SELECT id, github_repo_owner, github_repo_name FROM startups WHERE github_repo_owner IS NOT NULL');
       
       // Need to import fetchAndCacheGitHubData inside or locally to avoid circular dependencies if any
       const { fetchAndCacheGitHubData } = require('./githubService');

       for (const st of startups) {
          try {
             await fetchAndCacheGitHubData(st.id, st.github_repo_owner, st.github_repo_name);
             // brief delay to avoid hitting limits too fast
             await new Promise(r => setTimeout(r, 1000));
          } catch(err) {
             console.error(`Failed to refresh repo for startup ${st.id}`);
          }
       }
       console.log('GitHub cache refresh complete.');
    } catch(err) {}
  });

  // Run every Monday at midnight for Gamification Weekly Active
  cron.schedule('0 0 * * 1', async () => {
    try {
      console.log('Running weekly gamification check...');
      // 5 distinct days of 'daily_login' in the last 7 days
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT user_id, COUNT(DISTINCT DATE(created_at)) as days_active
        FROM xp_events
        WHERE event_type = "daily_login"
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY user_id
        HAVING days_active >= 5
      `);

      const { awardXP } = require('./xpService');
      for (const row of rows) {
         await awardXP(row.user_id, 'weekly_active');
      }
      console.log('Weekly gamification check complete.');
    } catch(err) {
      console.error('Error in weekly cron', err);
    }
  });
};
