import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { buildObjectUrl, minioClient } from '../services/minio';
import { calculateStartupPulse } from '../utils/startupHealth';
import { analyzePitchTextWithAI, generatePitchOutlineWithAI, suggestStartupMilestonesWithAI } from '../services/startupAIService';
import { extractPdfTextFromMinio } from '../services/minioDocumentService';
import { emitToUser } from '../services/realtime';
import { sendMail } from '../services/email';

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
    const [mentorRequestStatusRows] = await pool.query<RowDataPacket[]>(
      `SELECT status
       FROM startup_mentor_access_requests
       WHERE startup_id = ? AND mentor_id = ? AND student_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [id, userId, startup.created_by]
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
    const [upvoteCountRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS upvote_count FROM startup_upvotes WHERE startup_id = ?',
      [id]
    );
    const [upvoterRows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id AS user_id, u.name, p.avatar_url, su.created_at
       FROM startup_upvotes su
       JOIN users u ON u.id = su.user_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE su.startup_id = ?
       ORDER BY su.created_at DESC, u.id DESC`,
      [id]
    );
    const pulse = await calculateStartupPulse(id);

    res.json({
      success: true,
      data: {
        ...startup,
        members: hasPrivateAccess ? memberRows : [],
        open_roles: hasPrivateAccess ? rolesRows : [],
        has_private_access: hasPrivateAccess,
        my_role: isCreator ? 'founder' : (memberAccess[0]?.role ? String(memberAccess[0].role).toLowerCase() : null),
        my_mentor_request_status: mentorRequestStatusRows[0]?.status || null,
        upvote_count: Number(upvoteCountRows[0]?.upvote_count || 0),
        upvoters: upvoterRows,
        pulse_score: pulse.pulse_score,
        commits_last_7_days: pulse.commits_last_7_days,
        meetings_last_7_days: pulse.meetings_last_7_days,
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
    const extension = (file.originalname.split('.').pop() || 'png').toLowerCase();
    const normalizedExt = extension === 'jpeg' ? 'jpg' : extension;
    const objectName = `startups/logo_${id}.${normalizedExt}`;
    const logoVersion = Date.now();

    await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    const optimizedUrl = `${buildObjectUrl(bucketName, objectName)}?v=${logoVersion}`;

    await pool.query('UPDATE startups SET logo_url = ?, logo_object_name = ?, logo_version = ? WHERE id = ?', [optimizedUrl, objectName, logoVersion, id]);
    res.json({ success: true, data: { logo_url: optimizedUrl } });
  } catch (err) {
    next(err);
  }
};

// 2. Team Management
export const inviteMember = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const [authCheck] = await pool.query<RowDataPacket[]>('SELECT created_by, name FROM startups WHERE id = ?', [id]);
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

      emitToUser(inviteeId, 'member_invite', {
        startup_id: Number(id),
        startup_name: authCheck[0].name,
        role: role || 'Member',
        message: `You were invited to join ${authCheck[0].name}`,
      });

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

    emitToUser(mentor_id, 'mentor_access_request', {
      request_id: result.insertId,
      startup_id: Number(id),
      startup_name: startup.name,
      message: message || null,
      student_id: studentId,
    });

    try {
      const [mentorRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [mentor_id]);
      const [founderRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [studentId]);
      if (mentorRows.length > 0) {
        const mentor = mentorRows[0];
        const founder = founderRows[0];
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Mentorship Request</h2>
            <p>Hi <strong>${mentor.name}</strong>,</p>
            <p><strong>${founder?.name || 'A founder'}</strong> requested your mentorship for startup <strong>${startup.name}</strong>.</p>
            <p>Message: ${message || 'No note added.'}</p>
            <p>Please review this request in your dashboard.</p>
          </div>
        `;
        await sendMail(mentor.email, `Mentorship Request: ${startup.name}`, `Mentorship request received for ${startup.name}`, html);
      }
    } catch (mailErr) {
      console.error('Mentor request email failed (non-blocking):', mailErr);
    }

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

    try {
      const [studentRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [reqRow.student_id]);
      const [startupRows] = await pool.query<RowDataPacket[]>('SELECT name FROM startups WHERE id = ? LIMIT 1', [reqRow.startup_id]);
      if (studentRows.length > 0 && startupRows.length > 0) {
        const student = studentRows[0];
        const startup = startupRows[0];
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Mentorship Request Approved ✅</h2>
            <p>Hi <strong>${student.name}</strong>,</p>
            <p>Your mentorship request for <strong>${startup.name}</strong> has been approved.</p>
            <p>The mentor is now connected to your startup.</p>
          </div>
        `;
        await sendMail(student.email, `Approved: Mentorship for ${startup.name}`, `Your mentorship request for ${startup.name} was approved.`, html);
      }
    } catch (mailErr) {
      console.error('Mentor access approval email failed (non-blocking):', mailErr);
    }

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

    try {
      const [detailRows] = await pool.query<RowDataPacket[]>(
        `SELECT r.student_id, s.name AS startup_name
         FROM startup_mentor_access_requests r
         JOIN startups s ON s.id = r.startup_id
         WHERE r.id = ? LIMIT 1`,
        [requestId]
      );
      if (detailRows.length > 0) {
        const detail = detailRows[0];
        const [studentRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [detail.student_id]);
        if (studentRows.length > 0) {
          const student = studentRows[0];
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Mentorship Request Update</h2>
              <p>Hi <strong>${student.name}</strong>,</p>
              <p>Your mentorship request for <strong>${detail.startup_name}</strong> was declined this time.</p>
            </div>
          `;
          await sendMail(student.email, `Update: Mentorship for ${detail.startup_name}`, `Your mentorship request for ${detail.startup_name} was declined.`, html);
        }
      }
    } catch (mailErr) {
      console.error('Mentor access rejection email failed (non-blocking):', mailErr);
    }

    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
};

export const volunteerAsMentor = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mentorId = req.user.id;
    const { id } = req.params;
    const { message } = req.body || {};

    if (req.user.role !== 'mentor') {
      res.status(403).json({ success: false, error: 'Only mentors can volunteer.' });
      return;
    }

    const [startupRows] = await pool.query<RowDataPacket[]>('SELECT id, created_by, name FROM startups WHERE id = ?', [id]);
    if (startupRows.length === 0) {
      res.status(404).json({ success: false, error: 'Startup not found' });
      return;
    }

    const startup = startupRows[0];

    const [existingMembership] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM startup_members WHERE startup_id = ? AND user_id = ? LIMIT 1',
      [id, mentorId]
    );
    if (existingMembership.length > 0) {
      res.status(409).json({ success: false, error: 'You are already associated with this startup.' });
      return;
    }

    const [existingPending] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM startup_mentor_access_requests
       WHERE startup_id = ? AND mentor_id = ? AND student_id = ? AND status = 'pending'
       LIMIT 1`,
      [id, mentorId, startup.created_by]
    );
    if (existingPending.length > 0) {
      res.status(409).json({ success: false, error: 'You already sent a volunteer request for this startup.' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO startup_mentor_access_requests
       (startup_id, student_id, mentor_id, message, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [id, startup.created_by, mentorId, message || 'I would like to volunteer as a mentor for this startup.']
    );

    try {
      const [founderRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [startup.created_by]);
      const [mentorRows] = await pool.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ? LIMIT 1', [mentorId]);
      if (founderRows.length > 0) {
        const founder = founderRows[0];
        const mentor = mentorRows[0];
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Mentor Volunteer ✨</h2>
            <p>Hi <strong>${founder.name}</strong>,</p>
            <p><strong>${mentor?.name || 'A mentor'}</strong> volunteered to mentor your startup <strong>${startup.name}</strong>.</p>
            <p>Message: ${message || 'I would like to volunteer as a mentor for this startup.'}</p>
            <p>Please approve or reject this in your dashboard.</p>
          </div>
        `;
        await sendMail(founder.email, `Mentor Volunteer: ${startup.name}`, `A mentor volunteered for ${startup.name}.`, html);
      }
    } catch (mailErr) {
      console.error('Mentor volunteer email failed (non-blocking):', mailErr);
    }

    res.status(201).json({ success: true, request_id: result.insertId, message: 'Volunteer request sent to startup founder.' });
  } catch (err) {
    next(err);
  }
};

export const getIncomingMentorVolunteerRequests = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const founderId = req.user.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.startup_id, r.student_id, r.mentor_id, r.message, r.status, r.reviewed_at, r.created_at,
              s.name AS startup_name,
              m.name AS mentor_name, m.email AS mentor_email, up.avatar_url AS mentor_avatar
       FROM startup_mentor_access_requests r
       JOIN startups s ON s.id = r.startup_id
       JOIN users m ON m.id = r.mentor_id
       LEFT JOIN user_profiles up ON up.user_id = m.id
       WHERE s.created_by = ?
       ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC`,
      [founderId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const approveMentorVolunteerRequest = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const founderId = req.user.id;
    const { requestId } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*
       FROM startup_mentor_access_requests r
       JOIN startups s ON s.id = r.startup_id
       WHERE r.id = ? AND s.created_by = ?
       LIMIT 1`,
      [requestId, founderId]
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
      [reqRow.startup_id, reqRow.mentor_id, 'Mentor Advisor']
    );

    try {
      const [mentorRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [reqRow.mentor_id]);
      const [startupRows] = await pool.query<RowDataPacket[]>('SELECT name FROM startups WHERE id = ? LIMIT 1', [reqRow.startup_id]);
      if (mentorRows.length > 0 && startupRows.length > 0) {
        const mentor = mentorRows[0];
        const startup = startupRows[0];
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Volunteer Request Approved 🎉</h2>
            <p>Hi <strong>${mentor.name}</strong>,</p>
            <p>Your volunteer request for <strong>${startup.name}</strong> has been approved.</p>
            <p>You are now added as a mentor advisor.</p>
          </div>
        `;
        await sendMail(mentor.email, `Approved: ${startup.name} mentorship`, `Your volunteer request for ${startup.name} has been approved.`, html);
      }
    } catch (mailErr) {
      console.error('Volunteer approval email failed (non-blocking):', mailErr);
    }

    res.json({ success: true, message: 'Mentor volunteer approved.' });
  } catch (err) {
    next(err);
  }
};

export const rejectMentorVolunteerRequest = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const founderId = req.user.id;
    const { requestId } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.status
       FROM startup_mentor_access_requests r
       JOIN startups s ON s.id = r.startup_id
       WHERE r.id = ? AND s.created_by = ?
       LIMIT 1`,
      [requestId, founderId]
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

    try {
      const [detailRows] = await pool.query<RowDataPacket[]>(
        `SELECT r.mentor_id, s.name AS startup_name
         FROM startup_mentor_access_requests r
         JOIN startups s ON s.id = r.startup_id
         WHERE r.id = ? LIMIT 1`,
        [requestId]
      );
      if (detailRows.length > 0) {
        const detail = detailRows[0];
        const [mentorRows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [detail.mentor_id]);
        if (mentorRows.length > 0) {
          const mentor = mentorRows[0];
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Volunteer Request Update</h2>
              <p>Hi <strong>${mentor.name}</strong>,</p>
              <p>Your volunteer request for <strong>${detail.startup_name}</strong> was declined.</p>
            </div>
          `;
          await sendMail(mentor.email, `Update: ${detail.startup_name} mentorship`, `Your volunteer request for ${detail.startup_name} was declined.`, html);
        }
      }
    } catch (mailErr) {
      console.error('Volunteer rejection email failed (non-blocking):', mailErr);
    }

    res.json({ success: true, message: 'Mentor volunteer rejected.' });
  } catch (err) {
    next(err);
  }
};

const assertStartupAccess = async (startupId: string, user: { id: number; role: string }, requireFounder = false) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, created_by, stage, domain, description, tagline, pitch_pdf_object_name FROM startups WHERE id = ? LIMIT 1', [startupId]);
  if (rows.length === 0) {
    return { ok: false as const, status: 404, error: 'Startup not found' };
  }

  const startup = rows[0];
  if (user.role === 'admin') {
    return { ok: true as const, startup };
  }

  const isFounder = Number(startup.created_by) === Number(user.id);
  if (requireFounder && !isFounder) {
    return { ok: false as const, status: 403, error: 'Only startup founder can perform this action' };
  }

  if (isFounder) {
    return { ok: true as const, startup };
  }

  const [memberRows] = await pool.query<RowDataPacket[]>('SELECT id FROM startup_members WHERE startup_id = ? AND user_id = ? LIMIT 1', [startupId, user.id]);
  if (memberRows.length === 0) {
    return { ok: false as const, status: 403, error: 'Not authorized' };
  }

  return { ok: true as const, startup };
};

export const analyzePitchDeck = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const auth = await assertStartupAccess(id, req.user, false);
    if (!auth.ok) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    const bucketName = process.env.MINIO_BUCKET || 'cloudcampus-bucket';
    const objectName = String(req.body?.pitch_pdf_object_name || auth.startup.pitch_pdf_object_name || '').trim();
    if (!objectName) {
      res.status(400).json({ success: false, error: 'No pitch PDF object found. Provide pitch_pdf_object_name or set startup pitch_pdf_object_name.' });
      return;
    }

    if (req.body?.pitch_pdf_object_name && req.body.pitch_pdf_object_name !== auth.startup.pitch_pdf_object_name) {
      await pool.query('UPDATE startups SET pitch_pdf_object_name = ? WHERE id = ?', [objectName, id]);
    }

    const pitchText = await extractPdfTextFromMinio(bucketName, objectName);
    if (!pitchText) {
      res.status(400).json({ success: false, error: 'Could not extract text from pitch deck PDF.' });
      return;
    }

    const analysis = await analyzePitchTextWithAI(pitchText);
    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
};

export const generatePitchOutline = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const auth = await assertStartupAccess(id, req.user, false);
    if (!auth.ok) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    const outline = await generatePitchOutlineWithAI({
      name: auth.startup.name,
      tagline: auth.startup.tagline,
      description: auth.startup.description,
      domain: auth.startup.domain,
    });

    res.json({ success: true, data: outline });
  } catch (err) {
    next(err);
  }
};

export const suggestMilestones = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const auth = await assertStartupAccess(id, req.user, false);
    if (!auth.ok) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    if (String(auth.startup.stage).toLowerCase() !== 'idea') {
      res.status(400).json({ success: false, error: 'Milestone suggestions are available only for idea-stage startups.' });
      return;
    }

    const aiMilestones = await suggestStartupMilestonesWithAI({
      name: auth.startup.name,
      domain: auth.startup.domain,
      description: auth.startup.description,
    });

    res.json({ success: true, data: aiMilestones });
  } catch (err) {
    next(err);
  }
};

export const createBarterListing = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { offer_text, need_text, details } = req.body || {};
    const auth = await assertStartupAccess(id, req.user, false);
    if (!auth.ok) {
      res.status(auth.status).json({ success: false, error: auth.error });
      return;
    }

    if (!offer_text || !need_text) {
      res.status(400).json({ success: false, error: 'offer_text and need_text are required.' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO barter_listings (startup_id, offer_text, need_text, details, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, offer_text, need_text, details || null, req.user.id]
    );

    res.status(201).json({ success: true, listing_id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const getStartupBarterListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, s.name AS startup_name
       FROM barter_listings b
       JOIN startups s ON s.id = b.startup_id
       WHERE b.startup_id = ?
       ORDER BY b.created_at DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getBarterMarketplace = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, s.name AS startup_name, s.domain, s.stage, s.logo_url
       FROM barter_listings b
       JOIN startups s ON s.id = b.startup_id
       WHERE b.status = 'open'
       ORDER BY b.created_at DESC
       LIMIT 200`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const tokenize = (txt: string): string[] =>
  String(txt || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);

export const getBarterMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const [mine] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM barter_listings WHERE startup_id = ? AND status = 'open'`,
      [id]
    );
    const [others] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, s.name AS startup_name, s.logo_url
       FROM barter_listings b
       JOIN startups s ON s.id = b.startup_id
       WHERE b.startup_id <> ? AND b.status = 'open'`,
      [id]
    );
    const [openRoles] = await pool.query<RowDataPacket[]>(
      `SELECT startup_id, title, skills_required
       FROM open_roles
       WHERE startup_id <> ? AND is_filled = FALSE`,
      [id]
    );

    const roleSkillMap = new Map<number, string>();
    for (const r of openRoles) {
      const parsed = Array.isArray(r.skills_required)
        ? r.skills_required
        : (() => {
            try {
              return JSON.parse(r.skills_required || '[]');
            } catch {
              return [];
            }
          })();
      const packed = [r.title, ...(parsed || [])].join(' ').toLowerCase();
      roleSkillMap.set(Number(r.startup_id), `${roleSkillMap.get(Number(r.startup_id)) || ''} ${packed}`.trim());
    }

    const results: any[] = [];
    for (const my of mine) {
      const myNeedTokens = tokenize(my.need_text);
      const myNeedSet = new Set(myNeedTokens);

      for (const candidate of others) {
        const candidateOffer = `${candidate.offer_text || ''} ${roleSkillMap.get(Number(candidate.startup_id)) || ''}`;
        const candidateTokens = tokenize(candidateOffer);
        const overlap = candidateTokens.filter((t: string) => myNeedSet.has(t));
        if (overlap.length === 0) continue;

        results.push({
          my_listing_id: my.id,
          matching_listing_id: candidate.id,
          startup_id: candidate.startup_id,
          startup_name: candidate.startup_name,
          startup_logo_url: candidate.logo_url,
          offer_text: candidate.offer_text,
          need_text: candidate.need_text,
          matched_terms: Array.from(new Set(overlap)).slice(0, 8),
          match_score: Math.min(100, overlap.length * 15),
        });
      }
    }

    results.sort((a, b) => b.match_score - a.match_score);
    res.json({ success: true, data: results.slice(0, 50) });
  } catch (err) {
    next(err);
  }
};
