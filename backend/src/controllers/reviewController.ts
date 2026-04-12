import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';

export const submitReview = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // startup_id
    const { reviewee_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      return;
    }

    await pool.query(
      'INSERT INTO peer_reviews (startup_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, reviewer_id, reviewee_id, rating, comment]
    );

    res.status(201).json({ success: true, message: 'Review submitted' });
  } catch (err) {
    next(err);
  }
};

export const getStartupReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // startup_id

    const [rows] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at,
             reviewer.name as reviewer_name,
             reviewee.name as reviewee_name
      FROM peer_reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN users reviewee ON r.reviewee_id = reviewee.id
      WHERE r.startup_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getUserReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, s.name as startup_name,
             reviewer.name as reviewer_name
      FROM peer_reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN startups s ON r.startup_id = s.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
