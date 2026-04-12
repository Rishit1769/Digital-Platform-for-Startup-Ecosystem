import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const getSkillGaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT skills FROM user_profiles');
    
    const skillCounts: Record<string, number> = {};

    rows.forEach(row => {
      let skills: string[] = [];
      if (typeof row.skills === 'string') {
        try {
          skills = JSON.parse(row.skills);
        } catch(e) {}
      } else if (Array.isArray(row.skills)) {
        skills = row.skills;
      }
      
      skills.forEach(skill => {
        const normalized = skill.toLowerCase().trim();
        skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
      });
    });

    const sortedSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, data: sortedSkills });
  } catch (err) {
    next(err);
  }
};
