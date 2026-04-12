import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { minioClient } from '../services/minio';

// GET /api/news — public
export const getNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const offset = (page - 1) * limit;
    const category = req.query.category as string;

    let query = `
      SELECT n.id, n.title, n.content, n.category, n.image_url, n.created_at,
             u.name as admin_name
      FROM news n
      JOIN users u ON n.admin_id = u.id
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' WHERE n.category = ?';
      params.push(category);
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM news${category && category !== 'all' ? ' WHERE category = ?' : ''}`,
      category && category !== 'all' ? [category] : []
    );

    res.json({ success: true, data: rows, total, page, limit });
  } catch (err) { next(err); }
};

// POST /api/admin/news — admin only
export const createNews = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Title and content are required.' });
      return;
    }

    let image_url: string | null = null;

    if (req.file) {
      const file = req.file;
      const bucketName = process.env.MINIO_BUCKET || 'startup-ecosystem';
      const ext = file.originalname.split('.').pop();
      const objectName = `news/news_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });

      image_url = await minioClient.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO news (title, content, category, image_url, admin_id) VALUES (?, ?, ?, ?, ?)',
      [title, content, category || 'general', image_url, req.user.id]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, title, content, category, image_url, admin_id: req.user.id } });
  } catch (err) { next(err); }
};

// DELETE /api/admin/news/:id — admin only
export const deleteNews = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM news WHERE id = ?', [id]);
    res.json({ success: true, message: 'News deleted.' });
  } catch (err) { next(err); }
};

// PATCH /api/settings — update startup_intent (authenticated)
export const updateSettings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startup_intent } = req.body;
    const validValues = ['has_startup', 'finding_startup', null];

    if (startup_intent !== undefined && !validValues.includes(startup_intent)) {
      res.status(400).json({ success: false, error: 'Invalid startup_intent value.' });
      return;
    }

    await pool.query(
      'UPDATE users SET startup_intent = ? WHERE id = ?',
      [startup_intent ?? null, req.user.id]
    );

    res.json({ success: true, message: 'Settings updated.' });
  } catch (err) { next(err); }
};

// GET /api/settings — get current user settings
export const getSettings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT startup_intent, phone, email, name, role FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};
