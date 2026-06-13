import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import type { UserRole } from '@startup-ecosystem/db';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token) as { id?: number } | null;

  if (!decoded?.id) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true },
    });

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

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Access denied. You do not have permission.' });
      return;
    }
    next();
  };
};

// Alias for single-role checks
export const requireRole = (role: UserRole) => authorize(role);
