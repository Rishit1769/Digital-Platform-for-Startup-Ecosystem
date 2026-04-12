import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';

// ─── Ensure public_mentor_sessions table exists ───────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_mentor_sessions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        mentor_name VARCHAR(255) NOT NULL,
        description TEXT,
        session_date DATE,
        session_time VARCHAR(50),
        meet_link   VARCHAR(500) NOT NULL,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  INT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { /* table already exists */ }
})();

export const getVerificationRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.role, u.name, u.created_at, 
             p.bio, p.college, p.company, p.linkedin_url, p.skills
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN verification_badges v ON u.id = v.user_id
      WHERE u.role != 'admin' AND v.id IS NULL
      ORDER BY u.created_at DESC
    `);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const verifyUser = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { badge_type } = req.body;
    const adminId = req.user.id;

    if (!badge_type) {
      res.status(400).json({ success: false, error: 'Badge type is required' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Check if badge already exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM verification_badges WHERE user_id = ? AND badge_type = ?', [userId, badge_type]);
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO verification_badges (user_id, badge_type, granted_by) VALUES (?, ?, ?)',
        [userId, badge_type, adminId]
      );
    }

    res.json({ success: true, message: 'User verified successfully' });
  } catch (err) {
    next(err);
  }
};

export const revokeVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    await pool.query('DELETE FROM verification_badges WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Verification revoked' });
  } catch (err) {
    next(err);
  }
};

// ─── Public Mentor Sessions ───────────────────────────────────────

export const listPublicSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM public_mentor_sessions ORDER BY session_date ASC, created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const createPublicSession = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, mentor_name, description, session_date, session_time, meet_link } = req.body;
    if (!title || !mentor_name || !meet_link) {
      res.status(400).json({ success: false, error: 'title, mentor_name and meet_link are required' });
      return;
    }
    // Basic URL validation
    try { new URL(meet_link); } catch {
      res.status(400).json({ success: false, error: 'meet_link must be a valid URL' });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO public_mentor_sessions (title, mentor_name, description, session_date, session_time, meet_link, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, mentor_name, description || null, session_date || null, session_time || null, meet_link, req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
};

export const deletePublicSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM public_mentor_sessions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const togglePublicSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE public_mentor_sessions SET is_active = NOT is_active WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

