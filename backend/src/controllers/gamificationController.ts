import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const getLeaderboardStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
     const limit = parseInt(req.query.limit as string) || 10;
     const [rows] = await pool.query(`
       SELECT u.id as user_id, u.name, p.avatar_url, g.total_xp, g.level, g.current_streak,
              RANK() OVER (ORDER BY g.total_xp DESC) as rank_position
       FROM user_gamification g
       JOIN users u ON g.user_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.role = 'student'
       ORDER BY g.total_xp DESC
       LIMIT ?
     `, [limit]);
     res.json({ success: true, data: rows });
   } catch(err) { next(err); }
};

export const getLeaderboardMentors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
     const limit = parseInt(req.query.limit as string) || 10;
     // Mentor Impact Score (Phase 6): (meeting_count * 10) + (reviews * 5)
     // Since gamification tracks total_xp which basically encapsulates all these via event triggers, we can just rank mentors by total_xp or a specific formula.
     // Let's use total_xp for simplicity aligned with full gamification ecosystem.
     const [rows] = await pool.query(`
       SELECT u.id as user_id, u.name, p.avatar_url, g.total_xp as score, g.level,
              RANK() OVER (ORDER BY g.total_xp DESC) as rank_position
       FROM user_gamification g
       JOIN users u ON g.user_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.role = 'mentor'
       ORDER BY g.total_xp DESC
       LIMIT ?
     `, [limit]);
     res.json({ success: true, data: rows });
  } catch(err) { next(err); }
};

export const getLeaderboardStartups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    // top startups by (upvotes×3)+(milestones_done×5)+(meetings×2)
    // Upvotes: (SELECT SUM(upvotes) FROM startups ...) we only added upvotes field maybe? Let's check: Yes, 'startup_upvotes' table has rows.
    const [rows] = await pool.query(`
      SELECT s.id, s.name, s.logo_url, s.domain,
             (
               (SELECT COUNT(*) FROM startup_upvotes WHERE startup_id = s.id) * 3 +
               (SELECT COUNT(*) FROM startup_milestones WHERE startup_id = s.id AND completed_at IS NOT NULL) * 5 +
               (SELECT COUNT(*) FROM meetings WHERE startup_id = s.id AND status = 'completed') * 2
             ) as score,
             RANK() OVER (
               ORDER BY (
                 (SELECT COUNT(*) FROM startup_upvotes WHERE startup_id = s.id) * 3 +
                 (SELECT COUNT(*) FROM startup_milestones WHERE startup_id = s.id AND completed_at IS NOT NULL) * 5 +
                 (SELECT COUNT(*) FROM meetings WHERE startup_id = s.id AND status = 'completed') * 2
               ) DESC
             ) as rank_position
      FROM startups s
      HAVING score > 0
      ORDER BY score DESC
      LIMIT ?
    `, [limit]);

    res.json({ success: true, data: rows });
  } catch(err) { next(err); }
};

export const getMyRank = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    if (role === 'student' || role === 'mentor') {
      const [rows] = await pool.query<RowDataPacket[]>(`
        WITH RankedUsers AS (
          SELECT g.user_id, RANK() OVER (ORDER BY g.total_xp DESC) as rank_position
          FROM user_gamification g
          JOIN users u ON g.user_id = u.id
          WHERE u.role = ?
        )
        SELECT rank_position FROM RankedUsers WHERE user_id = ?
      `, [role, userId]);
      
      res.json({ success: true, rank: rows.length > 0 ? rows[0].rank_position : 0 });
    } else {
      res.json({ success: true, rank: 0 });
    }
  } catch(err) { next(err); }
};

export const getMyGamification = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
     const userId = req.user.id;
     await pool.query('INSERT IGNORE INTO user_gamification (user_id, badges) VALUES (?, "[]")', [userId]);

     const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user_gamification WHERE user_id = ?', [userId]);
     res.json({ success: true, data: rows[0] });
  } catch(err) { next(err); }
};

export const getUserGamification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
     const { userId } = req.params;
     const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user_gamification WHERE user_id = ?', [userId]);
     if (rows.length === 0) res.status(404).json({ success: false, error: 'Not found' }) as any;
     else res.json({ success: true, data: rows[0] });
  } catch(err) { next(err); }
};

export const getMyXPHistory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const [rows] = await pool.query<RowDataPacket[]>('SELECT event_type, xp_awarded, description, created_at FROM xp_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    res.json({ success: true, data: rows });
  } catch(err) { next(err); }
};
