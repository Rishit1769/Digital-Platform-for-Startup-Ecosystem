import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';

export const postOpenRole = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // startup id
    const { title, description, skills_required } = req.body;
    const userId = req.user.id;

    // Check authority
    const [authCheck] = await pool.query<RowDataPacket[]>('SELECT created_by FROM startups WHERE id = ?', [id]);
    if (authCheck.length === 0 || authCheck[0].created_by !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await pool.query(
      'INSERT INTO open_roles (startup_id, title, description, skills_required, posted_by) VALUES (?, ?, ?, ?, ?)',
      [id, title, description, JSON.stringify(skills_required || []), userId]
    );

    res.status(201).json({ success: true, message: 'Role posted perfectly' });
  } catch (err) {
    next(err);
  }
};

export const getOpenRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skill, domain } = req.query;
    
    let query = `
      SELECT r.id, r.title, r.description, r.skills_required, r.created_at,
             s.name as startup_name, s.logo_url, s.domain
      FROM open_roles r
      JOIN startups s ON r.startup_id = s.id
      WHERE r.is_filled = FALSE
    `;
    const params: any[] = [];

    if (skill) {
      query += ` AND JSON_CONTAINS(r.skills_required, JSON_QUOTE(?))`;
      params.push(skill);
    }
    
    if (domain) {
      query += ` AND s.domain = ?`;
      params.push(domain);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const applyForRole = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { message } = req.body;
    const applicantId = req.user.id;

    const [roleRows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.startup_id, s.created_by
       FROM open_roles r
       JOIN startups s ON s.id = r.startup_id
       WHERE r.id = ?
       LIMIT 1`,
      [roleId]
    );

    if (roleRows.length === 0) {
      res.status(404).json({ success: false, error: 'Role not found' });
      return;
    }

    if (Number(roleRows[0].created_by) === Number(applicantId)) {
      res.status(403).json({ success: false, error: 'Founder cannot apply to their own startup roles.' });
      return;
    }

    const [check] = await pool.query<RowDataPacket[]>('SELECT id FROM role_applications WHERE open_role_id = ? AND applicant_id = ?', [roleId, applicantId]);
    if (check.length > 0) {
      res.status(400).json({ success: false, error: 'Already applied' });
      return;
    }

    await pool.query(
      'INSERT INTO role_applications (open_role_id, applicant_id, message) VALUES (?, ?, ?)',
      [roleId, applicantId, message]
    );
    res.json({ success: true, message: 'Application submitted' });
  } catch (err) {
    next(err);
  }
};

export const getApplications = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const userId = req.user.id;

    const [authCheck] = await pool.query<RowDataPacket[]>(`
      SELECT s.created_by FROM open_roles r
      JOIN startups s ON r.startup_id = s.id
      WHERE r.id = ?
    `, [roleId]);

    if (authCheck.length === 0 || authCheck[0].created_by !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const [apps] = await pool.query(`
          SELECT a.id, a.message, a.message AS cover_note, a.status, a.applied_at,
            u.name, u.name AS applicant_name, u.email, p.avatar_url, p.skills, p.linkedin_url
      FROM role_applications a
      JOIN users u ON a.applicant_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE a.open_role_id = ?
    `, [roleId]);

    res.json({ success: true, data: apps });
  } catch (err) {
    next(err);
  }
};

export const updateApplicationStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId, appId } = req.params;
    const { status } = req.body; // 'accepted' | 'rejected'
    const userId = req.user.id;

    const [authCheck] = await pool.query<RowDataPacket[]>(`
      SELECT s.created_by FROM open_roles r
      JOIN startups s ON r.startup_id = s.id
      WHERE r.id = ?
    `, [roleId]);

    if (authCheck.length === 0 || authCheck[0].created_by !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await pool.query('UPDATE role_applications SET status = ? WHERE id = ?', [status, appId]);
    res.json({ success: true, message: 'Application updated' });
  } catch (err) {
    next(err);
  }
};

export const getMyApplications = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`
      SELECT a.id, a.message, a.status, a.applied_at,
             r.title, s.name as startup_name, s.logo_url
      FROM role_applications a
      JOIN open_roles r ON a.open_role_id = r.id
      JOIN startups s ON r.startup_id = s.id
      WHERE a.applicant_id = ?
      ORDER BY a.applied_at DESC
    `, [userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

