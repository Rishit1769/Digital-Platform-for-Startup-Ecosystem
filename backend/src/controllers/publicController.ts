import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

// Ecosystem stats for landing page hero
export const getPublicStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [[users], [startups], [ideas], [funding]] = await Promise.all([
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM users WHERE role = "student"'),
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM startups'),
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM ideas'),
      pool.query<RowDataPacket[]>('SELECT SUM(funding_raised) as total FROM startups WHERE funding_raised IS NOT NULL'),
    ]);
    res.json({
      success: true,
      data: {
        founders: (users as RowDataPacket[])[0].c,
        startups: (startups as RowDataPacket[])[0].c,
        ideas:    (ideas as RowDataPacket[])[0].c,
        funding:  (funding as RowDataPacket[])[0].total || 0,
      },
    });
  } catch (err) { next(err); }
};

// Top startups by upvotes — no auth
export const getPublicShowcase = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT s.id, s.name, s.tagline, s.domain, s.stage, s.logo_url,
             COUNT(DISTINCT u.user_id) AS upvote_count,
             COUNT(DISTINCT m.user_id) AS member_count
      FROM startups s
      LEFT JOIN startup_upvotes u ON s.id = u.startup_id
      LEFT JOIN startup_members m ON s.id = m.startup_id
      GROUP BY s.id
      ORDER BY upvote_count DESC, s.created_at DESC
      LIMIT 6
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Top 5 students by XP — no auth
export const getPublicLeaderboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name, g.total_xp as xp, g.level,
             COALESCE(p.preferred_domains, p.interests, '[]') AS domains,
             (SELECT COUNT(*) FROM startup_members sm WHERE sm.user_id = u.id) AS startup_count
      FROM users u
      JOIN user_gamification g ON u.id = g.user_id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.role = 'student'
      ORDER BY g.total_xp DESC
      LIMIT 5
    `);

    const data = rows.map((r, i) => {
      let domain = '—';
      try {
        const arr = typeof r.domains === 'string' ? JSON.parse(r.domains) : r.domains;
        if (Array.isArray(arr) && arr.length > 0) domain = arr[0];
      } catch {}
      return { rank: i + 1, id: r.id, name: r.name, xp: r.xp, level: r.level, domain };
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Mentors list with expertise — no auth
export const getPublicMentors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name,
             COALESCE(p.expertise, 'General Mentorship') AS expertise,
             COALESCE(p.designation, '') AS designation,
             COALESCE(p.company, '') AS company,
             (
               SELECT COUNT(*) FROM office_hours oh
               WHERE oh.mentor_id = u.id AND oh.is_active = TRUE
               AND oh.date >= CURDATE()
             ) AS upcoming_slots
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.role = 'mentor'
      ORDER BY upcoming_slots DESC, u.created_at DESC
      LIMIT 8
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Full public startup directory with search + filters
export const getPublicStartupsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, stage, search, sort = 'recent', limit = '30', page = '1' } = req.query;
    const pageSize = Math.min(parseInt(limit as string, 10) || 30, 50);
    const offset   = (Math.max(parseInt(page as string, 10) || 1, 1) - 1) * pageSize;

    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (domain) { where += ' AND s.domain = ?'; params.push(domain); }
    if (stage)  { where += ' AND s.stage = ?';  params.push(stage);  }
    if (search) { where += ' AND (s.name LIKE ? OR s.tagline LIKE ? OR s.domain LIKE ?)';
      const like = `%${search}%`; params.push(like, like, like); }

    const orderBy = sort === 'upvotes' ? 'upvote_count DESC, s.created_at DESC'
                  : sort === 'members' ? 'member_count DESC, s.created_at DESC'
                  : 's.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT s.id, s.name, s.tagline, s.domain, s.stage, s.logo_url, s.github_url,
             COUNT(DISTINCT u.user_id)  AS upvote_count,
             COUNT(DISTINCT m.user_id)  AS member_count,
             cr.name                    AS founder_name
      FROM startups s
      LEFT JOIN startup_upvotes u  ON s.id = u.startup_id
      LEFT JOIN startup_members m  ON s.id = m.startup_id
      LEFT JOIN users cr           ON s.created_by = cr.id
      ${where}
      GROUP BY s.id, cr.name
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [[{ total }]] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT s.id) AS total FROM startups s ${where}
    `, params) as [RowDataPacket[], any];

    res.json({ success: true, data: rows, total });
  } catch (err) { next(err); }
};

// Full public mentors list with search
export const getPublicMentorsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, limit = '30', page = '1' } = req.query;
    const pageSize = Math.min(parseInt(limit as string, 10) || 30, 50);
    const offset   = (Math.max(parseInt(page as string, 10) || 1, 1) - 1) * pageSize;

    const params: any[] = [];
    let where = 'WHERE u.role = "mentor"';
    if (search) {
      where += ' AND (u.name LIKE ? OR p.designation LIKE ? OR p.company LIKE ? OR p.expertise LIKE ?)';
      const like = `%${search}%`; params.push(like, like, like, like);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name,
             COALESCE(p.expertise,    'General Mentorship') AS expertise,
             COALESCE(p.designation,  '')                   AS designation,
             COALESCE(p.company,      '')                   AS company,
             COALESCE(p.bio,          '')                   AS bio,
             (SELECT COUNT(*) FROM office_hours oh
              WHERE oh.mentor_id = u.id AND oh.is_active = TRUE AND oh.date >= CURDATE()
             ) AS upcoming_slots
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${where}
      ORDER BY upcoming_slots DESC, u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id ${where}`, params
    ) as [RowDataPacket[], any];

    res.json({ success: true, data: rows, total });
  } catch (err) { next(err); }
};

// Public ideas list — read-only, no auth
export const getPublicIdeas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, sort = 'recent', search, limit = '30', page = '1' } = req.query;
    const pageSize = Math.min(parseInt(limit as string, 10) || 30, 50);
    const offset   = (Math.max(parseInt(page as string, 10) || 1, 1) - 1) * pageSize;

    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (domain) { where += ' AND i.domain = ?'; params.push(domain); }
    if (search) { where += ' AND (i.title LIKE ? OR i.description LIKE ?)';
      const like = `%${search}%`; params.push(like, like); }

    const orderBy = sort === 'upvotes' ? 'i.upvotes DESC, i.created_at DESC'
                  : sort === 'feedback' ? 'feedback_count DESC, i.created_at DESC'
                  : 'i.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT i.id, i.title, i.description, i.domain, i.upvotes, i.created_at,
             u.name AS poster_name,
             COALESCE(p.avatar_url, '') AS avatar_url,
             (SELECT COUNT(*) FROM idea_feedback f WHERE f.idea_id = i.id) AS feedback_count
      FROM ideas i
      JOIN users u ON i.posted_by = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Public mentor sessions — visible to all, no auth
export const getPublicSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, mentor_name, description, session_date, session_time, meet_link FROM public_mentor_sessions WHERE is_active = TRUE ORDER BY session_date ASC, created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Recent activity ticker — aggregates latest events across the platform 
export const getPublicTicker = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [startups] = await pool.query<RowDataPacket[]>(
      'SELECT name, domain FROM startups ORDER BY created_at DESC LIMIT 3'
    );
    const [topUser] = await pool.query<RowDataPacket[]>(
      'SELECT u.name, g.total_xp, g.level FROM users u JOIN user_gamification g ON u.id = g.user_id WHERE u.role = "student" ORDER BY g.total_xp DESC LIMIT 1'
    );
    const [ideas] = await pool.query<RowDataPacket[]>(
      'SELECT title FROM ideas ORDER BY created_at DESC LIMIT 2'
    );
    const [news] = await pool.query<RowDataPacket[]>(
      'SELECT title FROM news ORDER BY created_at DESC LIMIT 3'
    );

    const items: string[] = [];

    (startups as RowDataPacket[]).forEach((s: any) => items.push(`▪ ${s.name} launched in ${s.domain}`));
    if ((topUser as RowDataPacket[]).length) {
      const u = (topUser as RowDataPacket[])[0] as any;
      items.push(`▪ ${u.name} leads the ecosystem — Level ${u.level} — ${u.total_xp.toLocaleString()} XP`);
    }
    (ideas as RowDataPacket[]).forEach((i: any) => items.push(`▪ New idea pitched: "${i.title}"`));
    (news as RowDataPacket[]).forEach((n: any) => items.push(`▪ ${n.title}`));

    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};
