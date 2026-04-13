import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { sendMail } from '../services/email';

// ─── Ensure public_mentor_sessions table exists ───────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_mentor_sessions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        mentor_name VARCHAR(255) NOT NULL,
        description TEXT,
        session_date DATE,
        session_time VARCHAR(50),
        meet_link   VARCHAR(500) NOT NULL,
        is_active   BOOLEAN DEFAULT TRUE,
        created_by  INT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS featured_works (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        startup_id     INT NOT NULL,
        headline       VARCHAR(255),
        summary        TEXT,
        hero_image_url VARCHAR(1024),
        cta_label      VARCHAR(100),
        cta_url        VARCHAR(1024),
        display_order  INT DEFAULT 0,
        is_active      BOOLEAN DEFAULT TRUE,
        created_by     INT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    try {
      await pool.query('ALTER TABLE startups ADD COLUMN startup_email VARCHAR(255) DEFAULT NULL');
    } catch (e) {
      // startup_email already exists
    }
  } catch (e) { /* table already exists */ }
})();

export const getVerificationRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.role, u.name, u.created_at, 
             p.bio, p.college, p.company, p.linkedin_url, p.skills
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN verification_badges v ON u.id = v.user_id
      WHERE u.role != 'admin' AND v.id IS NULL
      ORDER BY u.created_at DESC
    `);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const verifyUser = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { badge_type } = req.body;
    const adminId = req.user.id;

    if (!badge_type) {
      res.status(400).json({ success: false, error: 'Badge type is required' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, name, role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const user = rows[0];

    // Check if badge already exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM verification_badges WHERE user_id = ? AND badge_type = ?', [userId, badge_type]);
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO verification_badges (user_id, badge_type, granted_by) VALUES (?, ?, ?)',
        [userId, badge_type, adminId]
      );
    }

    // Send verification email
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px;">
          <h2 style="color: #1C1C1C;">Congratulations — You're Verified!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your account on the <strong>Ecosystem</strong> platform has been <strong>verified</strong> by our admin team.</p>
          <p>Your verification badge (<em>${badge_type}</em>) is now active on your profile.</p>
          <p style="margin-top: 24px; color: #888;">Log in to see your verified badge and unlock additional features.</p>
        </div>
      `;
      await sendMail(user.email, 'You have been verified on Ecosystem!', `Congratulations ${user.name}, your account has been verified!`, html);
    } catch (emailErr) {
      console.error('Verification email failed (non-blocking):', emailErr);
    }

    res.json({ success: true, message: 'User verified successfully' });
  } catch (err) {
    next(err);
  }
};

export const revokeVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch user before deleting
    const [rows] = await pool.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ?', [userId]);
    await pool.query('DELETE FROM verification_badges WHERE user_id = ?', [userId]);

    // Send rejection email
    if (rows.length > 0) {
      const user = rows[0];
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px;">
            <h2 style="color: #1C1C1C;">Verification Request Update</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your verification request on the <strong>Ecosystem</strong> platform has been reviewed.</p>
            <p>Unfortunately, your request has been <strong>rejected</strong> at this time. You may update your profile and resubmit for review.</p>
            <p style="margin-top: 24px; color: #888;">If you believe this is an error, please contact the platform admin.</p>
          </div>
        `;
        await sendMail(user.email, 'Verification Request Update — Ecosystem', `Hi ${user.name}, your verification request has been reviewed.`, html);
      } catch (emailErr) {
        console.error('Rejection email failed (non-blocking):', emailErr);
      }
    }

    res.json({ success: true, message: 'Verification revoked' });
  } catch (err) {
    next(err);
  }
};

// ─── Public Mentor Sessions ───────────────────────────────────────

export const listPublicSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM public_mentor_sessions ORDER BY session_date ASC, created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const createPublicSession = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, mentor_name, description, session_date, session_time, meet_link } = req.body;
    if (!title || !mentor_name || !meet_link) {
      res.status(400).json({ success: false, error: 'title, mentor_name and meet_link are required' });
      return;
    }
    // Basic URL validation
    try { new URL(meet_link); } catch {
      res.status(400).json({ success: false, error: 'meet_link must be a valid URL' });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO public_mentor_sessions (title, mentor_name, description, session_date, session_time, meet_link, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, mentor_name, description || null, session_date || null, session_time || null, meet_link, req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
};

export const deletePublicSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM public_mentor_sessions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const togglePublicSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE public_mentor_sessions SET is_active = NOT is_active WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Startup Leaders (Admin Dashboard) ───────────────────────────

export const getStartupLeaders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT s.id AS startup_id,
             s.name AS startup_name,
             s.domain,
             s.stage,
             s.startup_email,
             u.id AS leader_id,
             u.name AS leader_name,
             u.email AS leader_email,
             u.phone AS leader_phone,
             COUNT(DISTINCT m.user_id) AS member_count,
             COUNT(DISTINCT su.user_id) AS upvote_count,
             s.created_at
      FROM startups s
      JOIN users u ON u.id = s.created_by
      LEFT JOIN startup_members m ON m.startup_id = s.id
      LEFT JOIN startup_upvotes su ON su.startup_id = s.id
      GROUP BY s.id, u.id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const updateStartupLeaderContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startupId } = req.params;
    const { startup_email } = req.body;

    if (startup_email && !/^\S+@\S+\.\S+$/.test(startup_email)) {
      res.status(400).json({ success: false, error: 'startup_email must be a valid email' });
      return;
    }

    await pool.query('UPDATE startups SET startup_email = ? WHERE id = ?', [startup_email || null, startupId]);
    res.json({ success: true, message: 'Startup contact updated' });
  } catch (err) { next(err); }
};

// ─── Featured Work (Admin-managed homepage showcase) ─────────────

export const listFeaturedWorks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT fw.*, s.name AS startup_name, s.domain, s.stage
      FROM featured_works fw
      JOIN startups s ON s.id = fw.startup_id
      ORDER BY fw.display_order ASC, fw.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const createFeaturedWork = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      startup_id,
      headline,
      summary,
      hero_image_url,
      cta_label,
      cta_url,
      display_order,
      is_active,
    } = req.body;

    if (!startup_id) {
      res.status(400).json({ success: false, error: 'startup_id is required' });
      return;
    }
    if (cta_url) {
      try { new URL(cta_url); } catch {
        res.status(400).json({ success: false, error: 'cta_url must be a valid URL' });
        return;
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO featured_works
        (startup_id, headline, summary, hero_image_url, cta_label, cta_url, display_order, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(startup_id),
        headline || null,
        summary || null,
        hero_image_url || null,
        cta_label || null,
        cta_url || null,
        Number(display_order) || 0,
        is_active === undefined ? true : Boolean(is_active),
        req.user.id,
      ]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
};

export const deleteFeaturedWork = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM featured_works WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const toggleFeaturedWork = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE featured_works SET is_active = NOT is_active WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

