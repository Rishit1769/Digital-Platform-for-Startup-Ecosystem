import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { minioClient } from '../services/minio';
import { awardXP } from '../services/xpService';

// 1. Startup CRUD
export const createStartup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, tagline, description, domain, stage, github_url } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO startups (name, tagline, description, domain, stage, github_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, tagline, description, domain, stage || 'idea', github_url || null, userId]
    );

    await pool.query(
      'INSERT INTO startup_members (startup_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, userId, 'Founder']
    );

    await awardXP(userId, 'startup_created', result.insertId);

    res.status(201).json({ success: true, startup_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getStartups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, stage, limit = '20', page = '1' } = req.query;
    
    let query = 'SELECT * FROM startups WHERE 1=1';
    const params: any[] = [];

    if (domain) {
      query += ' AND domain = ?';
      params.push(domain);
    }
    if (stage) {
      query += ' AND stage = ?';
      params.push(stage);
    }

    const pageSize = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * pageSize;
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getStartupById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [startupRows] = await pool.query<RowDataPacket[]>('SELECT * FROM startups WHERE id = ?', [id]);
    
    if (startupRows.length === 0) {
      res.status(404).json({ success: false, error: 'Startup not found' });
      return;
    }
    
    const startup = startupRows[0];

    const [memberRows] = await pool.query(`
      SELECT m.id as member_id, u.id as user_id, u.name, p.avatar_url, m.role, m.joined_at
      FROM startup_members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE m.startup_id = ?
    `, [id]);

    const [rolesRows] = await pool.query('SELECT * FROM open_roles WHERE startup_id = ? AND is_filled = FALSE', [id]);

    res.json({ success: true, data: { ...startup, members: memberRows, open_roles: rolesRows } });
  } catch (err) {
    next(err);
  }
};

export const updateStartup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, tagline, description, domain, stage, github_url } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (rows.length === 0 || (rows[0].created_by !== userId && req.user.role !== 'admin')) {
      res.status(403).json({ success: false, error: 'Not authorized to update this startup' });
      return;
    }

    await pool.query(
      'UPDATE startups SET name=?, tagline=?, description=?, domain=?, stage=?, github_url=? WHERE id=?',
      [name, tagline, description, domain, stage, github_url, id]
    );

    res.json({ success: true, message: 'Startup updated' });
  } catch (err) {
    next(err);
  }
};

export const deleteStartup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (rows.length === 0 || (rows[0].created_by !== userId && req.user.role !== 'admin')) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await pool.query('DELETE FROM startups WHERE id = ?', [id]);
    res.json({ success: true, message: 'Startup deleted' });
  } catch (err) {
    next(err);
  }
};

export const uploadLogo = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image uploaded' });
      return;
    }

    // Auth check
    const [rows] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (rows.length === 0 || rows[0].created_by !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const file = req.file;
    const bucketName = process.env.MINIO_BUCKET || 'cloudcampus-bucket';
    const extension = file.originalname.split('.').pop();
    const objectName = `startups/logo_${id}_${Date.now()}.${extension}`;

    await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const presignedUrl = await minioClient.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);

    await pool.query('UPDATE startups SET logo_url = ? WHERE id = ?', [presignedUrl, id]);
    res.json({ success: true, data: { logo_url: presignedUrl } });
  } catch (err) {
    next(err);
  }
};

// 2. Team Management
export const inviteMember = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const [authCheck] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (authCheck.length === 0 || authCheck[0].created_by !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      res.status(404).json({ success: false, error: 'User with this email not found' });
      return;
    }

    const inviteeId = users[0].id;

    try {
      await pool.query('INSERT INTO startup_members (startup_id, user_id, role) VALUES (?, ?, ?)', [id, inviteeId, role || 'Member']);
      await awardXP(req.user.id, 'team_member_added', id);
      res.json({ success: true, message: 'Member added successfully' });
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ success: false, error: 'User is already a member' });
      } else {
        throw e;
      }
    }
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId } = req.params;

    const [authCheck] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (authCheck.length === 0 || authCheck[0].created_by !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await pool.query('DELETE FROM startup_members WHERE startup_id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.name, u.role as account_role, m.role as startup_role, p.avatar_url, p.skills
      FROM startup_members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE m.startup_id = ?
    `, [id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
