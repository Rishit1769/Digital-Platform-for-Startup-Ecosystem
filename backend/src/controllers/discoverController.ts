import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

export const discoverUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, skills, domains, search, page = '1', limit = '20' } = req.query;
    
    let query = `
      SELECT u.id, u.name, u.role, u.is_verified, 
             p.avatar_url, p.bio, p.skills, p.preferred_domains, 
             p.company, p.designation, p.college, p.year_of_study
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (skills) {
      const skillsArr = (skills as string).split(',').map(s => s.trim());
      // For each skill, use JSON_CONTAINS
      skillsArr.forEach(skill => {
        query += ` AND JSON_CONTAINS(p.skills, JSON_QUOTE(?))`;
        params.push(skill);
      });
    }

    if (domains) {
      const domainsArr = (domains as string).split(',').map(d => d.trim());
      domainsArr.forEach(domain => {
        query += ` AND JSON_CONTAINS(p.preferred_domains, JSON_QUOTE(?))`;
        params.push(domain);
      });
    }

    if (search) {
      // Using MATCH() AGAINST() for full-text search
      query += ` AND (MATCH(u.name) AGAINST(? IN BOOLEAN MODE) OR MATCH(p.bio) AGAINST(? IN BOOLEAN MODE))`;
      params.push(`*${search}*`, `*${search}*`);
    }

    const pageSize = parseInt(limit as string, 10) || 20;
    const currentPage = parseInt(page as string, 10) || 1;
    const offset = (currentPage - 1) * pageSize;

    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
