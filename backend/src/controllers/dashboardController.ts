import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const getDashboardFeed = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Recent startups (last 5 created)
    const [new_startups] = await pool.query<RowDataPacket[]>(`
      SELECT s.id, s.name, s.tagline, s.description, s.domain, s.stage, s.logo_url, u.name as founder_name
      FROM startups s
      JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    // Recent ideas (last 5)
    const [recent_ideas] = await pool.query<RowDataPacket[]>(`
      SELECT i.id, i.title, i.description, i.domain, i.upvotes, i.created_at, u.name as author_name
      FROM ideas i
      JOIN users u ON i.posted_by = u.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

    // Upcoming confirmed/pending meetings for this user
    const [upcoming_meetings] = await pool.query<RowDataPacket[]>(`
      SELECT m.id, m.title, m.status, m.confirmed_slot,
             u.name as other_party
      FROM meetings m
      JOIN users u ON (CASE WHEN m.organizer_id = ? THEN m.attendee_id ELSE m.organizer_id END) = u.id
      WHERE (m.organizer_id = ? OR m.attendee_id = ?)
        AND m.status IN ('pending', 'confirmed')
        AND (m.confirmed_slot IS NULL OR m.confirmed_slot >= NOW())
      ORDER BY m.confirmed_slot ASC, m.created_at ASC
      LIMIT 5
    `, [userId, userId, userId]);

    // Top mentors by meeting count
    const [mentorRows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name, p.avatar_url, p.company, p.designation,
             COUNT(m.id) as meeting_count
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN meetings m ON (m.organizer_id = u.id OR m.attendee_id = u.id)
      WHERE u.role = 'mentor'
      GROUP BY u.id, u.name, p.avatar_url, p.company, p.designation
      ORDER BY meeting_count DESC
      LIMIT 3
    `);

    // Trending skills: top 5 most common skills across profiles
    const [profileSkills] = await pool.query<RowDataPacket[]>('SELECT skills FROM user_profiles WHERE skills IS NOT NULL');
    const skillCounts: Record<string, number> = {};
    for (const row of profileSkills) {
      const skills: string[] = typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills;
      if (Array.isArray(skills)) {
        for (const s of skills) {
          const k = s.trim();
          if (k) skillCounts[k] = (skillCounts[k] || 0) + 1;
        }
      }
    }
    const trending_skills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    res.json({
      success: true,
      data: {
        new_startups,
        recent_ideas,
        upcoming_meetings,
        top_mentors: mentorRows,
        trending_skills: trending_skills.length ? trending_skills : []
      }
    });

  } catch(err) {
    next(err);
  }
};
