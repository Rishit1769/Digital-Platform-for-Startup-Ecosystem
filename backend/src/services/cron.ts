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
};
