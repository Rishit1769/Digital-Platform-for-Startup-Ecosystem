import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const getShowcase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sort = 'upvotes', domain } = req.query; // sort: 'upvotes' | 'newest'
    
    let query = `
      SELECT s.id, s.name, s.tagline, s.domain, s.stage, s.logo_url, 
             COUNT(DISTINCT u.user_id) as upvote_count,
             COUNT(DISTINCT m.user_id) as member_count
      FROM startups s
      LEFT JOIN startup_upvotes u ON s.id = u.startup_id
      LEFT JOIN startup_members m ON s.id = m.startup_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (domain) {
      query += ` AND s.domain = ?`;
      params.push(domain);
    }

    query += ` GROUP BY s.id`;
    
    if (sort === 'newest') {
      query += ` ORDER BY s.created_at DESC`;
    } else {
      query += ` ORDER BY upvote_count DESC, s.created_at DESC`;
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const toggleUpvote = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if upvote exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM startup_upvotes WHERE startup_id = ? AND user_id = ?', [id, userId]);

    if (existing.length > 0) {
      await pool.query('DELETE FROM startup_upvotes WHERE startup_id = ? AND user_id = ?', [id, userId]);
      res.json({ success: true, message: 'Upvote removed', action: 'removed' });
    } else {
      await pool.query('INSERT INTO startup_upvotes (startup_id, user_id) VALUES (?, ?)', [id, userId]);
      res.json({ success: true, message: 'Upvoted successfully', action: 'added' });
    }
  } catch (err) {
    next(err);
  }
};

export const checkUpvoteStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM startup_upvotes WHERE startup_id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, is_upvoted: existing.length > 0 });
  } catch (err) {
    next(err);
  }
};
