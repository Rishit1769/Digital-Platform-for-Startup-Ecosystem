import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';

export const postIdea = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, domain } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO ideas (title, description, domain, posted_by) VALUES (?, ?, ?, ?)',
      [title, description, domain, userId]
    );

    res.status(201).json({ success: true, idea_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getIdeas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sort = 'upvotes' } = req.query;
    let query = `
      SELECT i.id, i.title, i.description, i.domain, i.upvotes, i.created_at,
             u.name as poster_name, p.avatar_url,
             (SELECT COUNT(*) FROM idea_feedback WHERE idea_id = i.id) as feedback_count
      FROM ideas i
      JOIN users u ON i.posted_by = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
    `;

    if (sort === 'newest') {
      query += ` ORDER BY i.created_at DESC`;
    } else {
      query += ` ORDER BY i.upvotes DESC, i.created_at DESC`;
    }

    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const upvoteIdea = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // Real implementation would track user_id in an ideas_upvotes table like startup_upvotes
    // For simplicity based on prompt: "ideas(upvotes INT DEFAULT 0)"
    await pool.query('UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Idea upvoted' });
  } catch (err) {
    next(err);
  }
};

export const addFeedback = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    await pool.query(
      'INSERT INTO idea_feedback (idea_id, user_id, comment) VALUES (?, ?, ?)',
      [id, userId, comment]
    );

    res.status(201).json({ success: true, message: 'Feedback added' });
  } catch (err) {
    next(err);
  }
};

export const getIdeaWithFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const [ideaRows] = await pool.query<RowDataPacket[]>(`
      SELECT i.*, u.name as poster_name, p.avatar_url
      FROM ideas i
      JOIN users u ON i.posted_by = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE i.id = ?
    `, [id]);

    if (ideaRows.length === 0) {
      res.status(404).json({ success: false, error: 'Idea not found' });
      return;
    }

    const [feedbackRows] = await pool.query(`
      SELECT f.id, f.comment, f.created_at, u.name, p.avatar_url
      FROM idea_feedback f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE f.idea_id = ?
      ORDER BY f.created_at DESC
    `, [id]);

    res.json({ success: true, data: { ...ideaRows[0], feedback: feedbackRows } });
  } catch (err) {
    next(err);
  }
};
