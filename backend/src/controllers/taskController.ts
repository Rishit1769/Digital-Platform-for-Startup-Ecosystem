import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';

export const getTasks = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [tasks] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM kanban_tasks WHERE user_id = ? ORDER BY FIELD(priority,"urgent","high","medium","low"), created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

export const createTask = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, status = 'todo', priority = 'medium', due_date } = req.body;
    if (!title) { res.status(400).json({ success: false, error: 'Title is required' }); return; }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO kanban_tasks (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, status, priority, due_date || null]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM kanban_tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const updateTask = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM kanban_tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing.length) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    await pool.query(
      'UPDATE kanban_tasks SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), priority = COALESCE(?, priority), due_date = COALESCE(?, due_date) WHERE id = ?',
      [title ?? null, description ?? null, status ?? null, priority ?? null, due_date ?? null, id]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM kanban_tasks WHERE id = ?', [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

export const deleteTask = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM kanban_tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing.length) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    await pool.query('DELETE FROM kanban_tasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const moveTask = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked'];
    if (!validStatuses.includes(status)) { res.status(400).json({ success: false, error: 'Invalid status' }); return; }

    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM kanban_tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing.length) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    await pool.query('UPDATE kanban_tasks SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};
