import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { generateOTP } from '../utils/otp';
import { sendMail } from '../services/email';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const VERIFICATION_SECRET = process.env.JWT_SECRET + '_verification';

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, role, type } = req.body;
    
    if (!email || !type) {
      res.status(400).json({ success: false, error: 'Email and type are required' });
      return;
    }

    const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    
    if (type === 'register' && existingUsers.length > 0) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }
    if (type === 'forgot_password' && existingUsers.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await pool.query<ResultSetHeader>(
      'INSERT INTO otp_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, type, expiresAt]
    );

    const subject = type === 'register' ? 'Your Registration OTP - CloudCampus' : 'Password Reset OTP - CloudCampus';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>CloudCampus</h2>
        <p>Your one-time password is:</p>
        <h1 style="font-size: 36px; letter-spacing: 5px; color: #4F46E5;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `;

    await sendMail(email, subject, `Your OTP is ${otp}`, htmlBody);
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, type, role } = req.body;
    
    if (!email || !code || !type) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, expires_at, is_used FROM otp_codes WHERE email = ? AND code = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [email, code, type]
    );

    const otpRecord = rows[0];

    if (!otpRecord) {
      res.status(400).json({ success: false, error: 'Invalid OTP' });
      return;
    }
    if (otpRecord.is_used) {
      res.status(400).json({ success: false, error: 'OTP has already been used' });
      return;
    }
    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({ success: false, error: 'OTP has expired' });
      return;
    }

    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRecord.id]);

    const verificationToken = jwt.sign(
      { email, type, role }, // Storing role here so it can be used during registration
      VERIFICATION_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ success: true, data: { verificationToken } });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, password, verificationToken } = req.body;

    if (!email || !name || !password || !verificationToken) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(verificationToken, VERIFICATION_SECRET);
    } catch (err) {
      res.status(401).json({ success: false, error: 'Invalid or expired verification token' });
      return;
    }

    if (decoded.email !== email || decoded.type !== 'register') {
      res.status(400).json({ success: false, error: 'Token mismatch' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedRole = decoded.role || 'student';

    const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, password_hash, role, name, is_verified, is_email_verified) VALUES (?, ?, ?, ?, true, true)',
      [email, passwordHash, assignedRole, name]
    );

    const user = { id: result.insertId, email, role: assignedRole, name };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ success: true, data: { user, accessToken } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, data: { user: payload, accessToken } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'No refresh token' });
      return;
    }

    try {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key');
      const payload = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
      const newAccessToken = generateAccessToken(payload);
      
      res.json({ success: true, data: { accessToken: newAccessToken } });
    } catch (err) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, verificationToken } = req.body;

    if (!email || !password || !verificationToken) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(verificationToken, VERIFICATION_SECRET);
    } catch (err) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    if (decoded.email !== email || decoded.type !== 'forgot_password') {
      res.status(400).json({ success: false, error: 'Token mismatch' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
