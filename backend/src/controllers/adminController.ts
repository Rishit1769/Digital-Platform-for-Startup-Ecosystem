import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

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
