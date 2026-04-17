import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const calculateStartupSuccessScore = async (startupId: number | string): Promise<number> => {
  const [[upvotes], [members], [github]] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT COUNT(*) AS c FROM startup_upvotes WHERE startup_id = ?', [startupId]),
    pool.query<RowDataPacket[]>('SELECT COUNT(*) AS c FROM startup_members WHERE startup_id = ?', [startupId]),
    pool.query<RowDataPacket[]>('SELECT commit_count_week, commit_count_month FROM github_cache WHERE startup_id = ? LIMIT 1', [startupId]),
  ]);

  const upvoteCount = Number(upvotes[0]?.c || 0);
  const memberCount = Number(members[0]?.c || 0);
  const weeklyCommits = Number(github[0]?.commit_count_week || 0);
  const monthlyCommits = Number(github[0]?.commit_count_month || 0);

  const raw = (upvoteCount * 3.5) + (memberCount * 6) + (weeklyCommits * 4) + (monthlyCommits * 1.2);
  return Math.round(clamp(raw, 0, 100));
};

export const calculateStartupPulse = async (startupId: number | string): Promise<{ pulse_score: number; commits_last_7_days: number; meetings_last_7_days: number }> => {
  const [[github], [meetings]] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT commit_count_week FROM github_cache WHERE startup_id = ? LIMIT 1', [startupId]),
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c
       FROM meetings
       WHERE startup_id = ?
         AND status = 'completed'
         AND COALESCE(confirmed_slot, created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [startupId]
    ),
  ]);

  const commitsLastWeek = Number(github[0]?.commit_count_week || 0);
  const meetingsLastWeek = Number(meetings[0]?.c || 0);
  const rawPulse = (commitsLastWeek * 8) + (meetingsLastWeek * 12);

  return {
    pulse_score: Math.round(clamp(rawPulse, 0, 100)),
    commits_last_7_days: commitsLastWeek,
    meetings_last_7_days: meetingsLastWeek,
  };
};
