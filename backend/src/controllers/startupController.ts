import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { minioClient } from '../services/minio';

// 1. Startup CRUD
export const createStartup = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, tagline, description, domain, stage, github_url } = req.body;
    const userId = req.user.id;

    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, error: 'Startup name is required' });
      return;
    }

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM startups
       WHERE created_by = ?
         AND LOWER(TRIM(name)) = LOWER(TRIM(?))
       LIMIT 1`,
      [userId, name]
    );

    if (existingRows.length > 0) {
      res.status(409).json({
        success: false,
        error: 'You already created a startup with this name.',
        startup_id: existingRows[0].id,
      });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO startups (name, tagline, description, domain, stage, github_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, tagline, description, domain, stage || 'idea', github_url || null, userId]
    );

    await pool.query(
      'INSERT INTO startup_members (startup_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, userId, 'Founder']
    );

    res.status(201).json({ success: true, startup_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getHiringStartups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, stage, limit = '20', page = '1' } = req.query;
    const pageSize = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * pageSize;

    let query = `SELECT s.*, 
      JSON_ARRAYAGG(
        JSON_OBJECT('id', r.id, 'title', r.title, 'skills_required', r.skills_required)
      ) as open_roles
      FROM startups s
      INNER JOIN open_roles r ON r.startup_id = s.id AND r.is_filled = FALSE
      WHERE 1=1`;
    const params: any[] = [];

    if (domain) { query += ' AND s.domain = ?'; params.push(domain); }
    if (stage) { query += ' AND s.stage = ?'; params.push(stage); }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
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

export const getMyStartups = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, domain, stage, created_at
       FROM startups
       WHERE created_by = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getStartupById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const [startupRows] = await pool.query<RowDataPacket[]>('SELECT * FROM startups WHERE id = ?', [id]);
    
    if (startupRows.length === 0) {
      res.status(404).json({ success: false, error: 'Startup not found' });
      return;
    }
    
    const startup = startupRows[0];

    const [memberAccess] = await pool.query<RowDataPacket[]>(
      'SELECT role FROM startup_members WHERE startup_id = ? AND user_id = ? LIMIT 1',
      [id, userId]
    );

    const [mentorAccess] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM startup_mentor_access_requests
       WHERE startup_id = ? AND mentor_id = ? AND status = 'approved'
       LIMIT 1`,
      [id, userId]
    );

    const isCreator = startup.created_by === userId;
    const isMember = memberAccess.length > 0;
    const isApprovedMentor = mentorAccess.length > 0;
    const hasPrivateAccess =
      userRole === 'admin' ||
      isCreator ||
      isMember ||
      (userRole === 'mentor' && isApprovedMentor) ||
      userRole === 'student';

    const [memberRows] = await pool.query(`
      SELECT m.id as member_id, u.id as user_id, u.name, p.avatar_url, m.role, m.joined_at
      FROM startup_members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE m.startup_id = ?
    `, [id]);

    const [rolesRows] = await pool.query('SELECT * FROM open_roles WHERE startup_id = ? AND is_filled = FALSE', [id]);

    res.json({
      success: true,
      data: {
        ...startup,
        members: hasPrivateAccess ? memberRows : [],
        open_roles: hasPrivateAccess ? rolesRows : [],
        has_private_access: hasPrivateAccess,
        my_role: isCreator ? 'founder' : (memberAccess[0]?.role ? String(memberAccess[0].role).toLowerCase() : null),
      },
    });
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

export const requestMentorStartupAccess = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { mentor_id, message } = req.body;
    const studentId = req.user.id;

    if (!mentor_id) {
      res.status(400).json({ success: false, error: 'mentor_id is required' });
      return;
    }

    const [startupRows] = await pool.query<RowDataPacket[]>('SELECT id, created_by, name FROM startups WHERE id = ?', [id]);
    if (startupRows.length === 0) {
      res.status(404).json({ success: false, error: 'Startup not found' });
      return;
    }

    const startup = startupRows[0];
    if (Number(startup.created_by) !== Number(studentId)) {
      res.status(403).json({ success: false, error: 'Only startup founder can request mentor access' });
      return;
    }

    const [mentorRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ? AND role = "mentor" LIMIT 1',
      [mentor_id]
    );
    if (mentorRows.length === 0) {
      res.status(404).json({ success: false, error: 'Mentor not found' });
      return;
    }

    const [existingPending] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM startup_mentor_access_requests
       WHERE startup_id = ? AND mentor_id = ? AND status = 'pending'
       LIMIT 1`,
      [id, mentor_id]
    );
    if (existingPending.length > 0) {
      res.status(409).json({ success: false, error: 'A pending request already exists for this mentor' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO startup_mentor_access_requests
       (startup_id, student_id, mentor_id, message, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [id, studentId, mentor_id, message || null]
    );

    res.status(201).json({ success: true, request_id: result.insertId, message: 'Mentor access request sent' });
  } catch (err) {
    next(err);
  }
};

export const getOutgoingMentorAccessRequests = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.startup_id, r.mentor_id, r.message, r.status, r.reviewed_at, r.created_at,
              s.name AS startup_name,
              m.name AS mentor_name, m.email AS mentor_email
       FROM startup_mentor_access_requests r
       JOIN startups s ON s.id = r.startup_id
       JOIN users m ON m.id = r.mentor_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [studentId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getIncomingMentorAccessRequests = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mentorId = req.user.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.startup_id, r.student_id, r.message, r.status, r.reviewed_at, r.created_at,
              s.name AS startup_name, s.domain, s.stage,
              st.name AS student_name, st.email AS student_email
       FROM startup_mentor_access_requests r
       JOIN startups s ON s.id = r.startup_id
       JOIN users st ON st.id = r.student_id
       WHERE r.mentor_id = ?
       ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC`,
      [mentorId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const approveMentorAccessRequest = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requestId } = req.params;
    const mentorId = req.user.id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM startup_mentor_access_requests
       WHERE id = ? AND mentor_id = ? LIMIT 1`,
      [requestId, mentorId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }

    const reqRow = rows[0];
    if (reqRow.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Request is already processed' });
      return;
    }

    await pool.query(
      `UPDATE startup_mentor_access_requests
       SET status = 'approved', reviewed_at = NOW()
       WHERE id = ?`,
      [requestId]
    );

    await pool.query(
      `INSERT INTO startup_members (startup_id, user_id, role)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [reqRow.startup_id, mentorId, 'Mentor Advisor']
    );

    res.json({ success: true, message: 'Access approved. You can now access this startup.' });
  } catch (err) {
    next(err);
  }
};

export const rejectMentorAccessRequest = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requestId } = req.params;
    const mentorId = req.user.id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, status FROM startup_mentor_access_requests
       WHERE id = ? AND mentor_id = ? LIMIT 1`,
      [requestId, mentorId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    if (rows[0].status !== 'pending') {
      res.status(400).json({ success: false, error: 'Request is already processed' });
      return;
    }

    await pool.query(
      `UPDATE startup_mentor_access_requests
       SET status = 'rejected', reviewed_at = NOW()
       WHERE id = ?`,
      [requestId]
    );

    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
};
