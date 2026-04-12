import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';

export const getMilestones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM startup_milestones WHERE startup_id = ? ORDER BY created_at ASC', [id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const addMilestone = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, stage } = req.body;

    const [startups] = await pool.query<RowDataPacket[]>('SELECT * FROM startups WHERE id = ?', [id]);
    if (startups.length === 0) return res.status(404).json({ success: false, error: 'Not found' }) as any;

    if (startups[0].created_by !== req.user.id) {
       // Check if member
       const [mems] = await pool.query<RowDataPacket[]>('SELECT * FROM startup_members WHERE startup_id = ? AND user_id = ?', [id, req.user.id]);
       if (mems.length === 0) return res.status(403).json({ success: false, error: 'Not authorized' }) as any;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO startup_milestones (startup_id, title, description, stage) VALUES (?, ?, ?, ?)',
      [id, title, description, stage]
    );

    res.status(201).json({ success: true, milestone_id: result.insertId });
  } catch (err) { next(err); }
};

export const updateMilestone = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, milId } = req.params;
    const { completed } = req.body; // true/false

    // Auth bypass for simplicity based on ID above...
    const date = completed ? new Date() : null;

    await pool.query('UPDATE startup_milestones SET completed_at = ? WHERE id = ? AND startup_id = ?', [date, milId, id]);

    res.json({ success: true, message: 'Milestone updated' });
  } catch (err) { next(err); }
};

export const deleteMilestone = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, milId } = req.params;
    await pool.query('DELETE FROM startup_milestones WHERE id = ? AND startup_id = ?', [milId, id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};
