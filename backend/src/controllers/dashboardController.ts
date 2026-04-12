import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const getDashboardFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Return recent activity across the ecosystem:
    // { new_startups: [], recent_ideas: [], upcoming_meetings: [], top_mentors: [], trending_skills: [] }

    // Dummy logic for now for startups, ideas, meetings
    const new_startups = [
      { id: 1, name: 'EcoTech', description: 'Sustainable packaging solutions' },
      { id: 2, name: 'HealthAI', description: 'AI driven diagnostics' }
    ];

    const upcoming_meetings = [
      { id: 101, title: 'Mentorship Session with John', time: 'Tomorrow, 10:00 AM' }
    ];

    // Fetch popular mentors
    const [mentorRows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name, p.avatar_url, p.company, p.designation
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      WHERE u.role = 'mentor'
      LIMIT 3
    `);

    // Fetch trending skills (just get top 5 from skill_gaps logic visually)
    const trending_skills = ['React', 'Node.js', 'Go', 'Machine Learning', 'Marketing'];

    res.json({
      success: true,
      data: {
        new_startups,
        recent_ideas: [],
        upcoming_meetings,
        top_mentors: mentorRows,
        trending_skills
      }
    });

  } catch(err) {
    next(err);
  }
};
