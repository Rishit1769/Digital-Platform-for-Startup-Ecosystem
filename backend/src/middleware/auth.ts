import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2/promise';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded: any = verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) {
      res.status(401).json({ success: false, error: 'User no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Access denied. You do not have permission.' });
      return;
    }
    next();
  };
};
