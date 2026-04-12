import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db';
import { minioClient } from '../services/minio';

// Helper to ensure profile exists
const ensureProfileExists = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT user_id FROM user_profiles WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    await pool.query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId]);
  }
};

export const getMyProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    
    // Get user base data + profile data + badges
    const [userRows] = await pool.query<RowDataPacket[]>('SELECT id, email, role, name, is_verified FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const user = userRows[0];

    const [profileRows] = await pool.query<RowDataPacket[]>('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const profile = profileRows[0] || {};

    const [badgeRows] = await pool.query<RowDataPacket[]>('SELECT badge_type FROM verification_badges WHERE user_id = ?', [userId]);
    const badges = badgeRows.map(row => row.badge_type);

    res.json({
      success: true,
      data: {
        ...user,
        profile,
        badges
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const { 
      bio, avatar_url, github_url, linkedin_url, 
      skills, interests, preferred_domains,
      college, year_of_study, cgpa,
      company, expertise, designation, years_of_experience
    } = req.body;

    await ensureProfileExists(userId);

    // Update query
    await pool.query(`
      UPDATE user_profiles 
      SET bio = ?, avatar_url = ?, github_url = ?, linkedin_url = ?,
          skills = ?, interests = ?, preferred_domains = ?,
          college = ?, year_of_study = ?, cgpa = ?,
          company = ?, expertise = ?, designation = ?, years_of_experience = ?
      WHERE user_id = ?
    `, [
      bio || null, avatar_url || null, github_url || null, linkedin_url || null,
      JSON.stringify(skills || []), JSON.stringify(interests || []), JSON.stringify(preferred_domains || []),
      college || null, year_of_study || null, cgpa || null,
      company || null, expertise || null, designation || null, years_of_experience || null,
      userId
    ]);

    res.json({ success: true, message: 'Profile updated successfully' });
    
    // Check if this is the first complete profile completion
    if (bio && skills && skills.length > 0) {
       const [xp] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM xp_events WHERE user_id = ? AND event_type = "profile_completed"', [userId]);
       if (xp[0].c === 0) {
          const { awardXP } = require('../services/xpService');
          await awardXP(userId, 'profile_completed');
       }
    }

  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image uploaded' });
      return;
    }
    
    const userId = req.user.id;
    const file = req.file;
    const bucketName = process.env.MINIO_BUCKET || 'cloudcampus-bucket';
    
    // File name: avatar_userId_timestamp.ext
    const extension = file.originalname.split('.').pop();
    const objectName = `avatars/avatar_${userId}_${Date.now()}.${extension}`;

    // Upload to MinIO
    await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    // Generate presigned URL (7 days)
    const presignedUrl = await minioClient.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);

    await ensureProfileExists(userId);
    await pool.query('UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?', [presignedUrl, userId]);

    res.json({ success: true, data: { avatar_url: presignedUrl } });
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const [userRows] = await pool.query<RowDataPacket[]>('SELECT id, role, name, is_verified FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const user = userRows[0];

    const [profileRows] = await pool.query<RowDataPacket[]>('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const profile = profileRows[0] || {};

    const [badgeRows] = await pool.query<RowDataPacket[]>('SELECT badge_type FROM verification_badges WHERE user_id = ?', [userId]);
    const badges = badgeRows.map(row => row.badge_type);

    res.json({
      success: true,
      data: {
        ...user,
        profile,
        badges
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getDiscoveryList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, skill, domain, limit = 20, offset = 0 } = req.query;
    let query = `
      SELECT u.id, u.name, u.role, u.is_verified, p.avatar_url, p.bio, p.skills, p.company, p.college
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }
    
    if (skill) {
      query += ` AND JSON_CONTAINS(p.skills, ?)`;
      params.push(JSON.stringify(typeof skill === 'string' ? [skill] : skill));
    }
    
    if (domain) {
      query += ` AND JSON_CONTAINS(p.preferred_domains, ?)`;
      params.push(JSON.stringify(typeof domain === 'string' ? [domain] : domain));
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
