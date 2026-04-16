import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { generateOTP } from '../utils/otp';
import { sendMail } from '../services/email';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const VERIFICATION_SECRET = process.env.JWT_SECRET + '_verification';

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, role, type, name, phone, password, startup_intent } = req.body;
    
    if (!email || !type) {
      res.status(400).json({ success: false, error: 'Email and type are required' });
      return;
    }

    if (type === 'register' && (!name || !phone || !password)) {
      res.status(400).json({ success: false, error: 'Name, phone, and password are required for registration' });
      return;
    }

    const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    
    if (type === 'register' && existingUsers.length > 0) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }
    if (type === 'forgot_password' && existingUsers.length === 0) {
      res.status(404).json({ success: false, error: 'No account found with this email.' });
      return;
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // For registration, hash the password and store the full payload securely
    let payload = null;
    if (type === 'register') {
      const passwordHash = await bcrypt.hash(password, 12);
      payload = JSON.stringify({ name, phone, role: role || 'student', passwordHash, startup_intent: startup_intent || null });
    }

    // Invalidate any previous unused OTPs for this email+type
    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE email = ? AND type = ? AND is_used = FALSE', [email, type]);

    await pool.query<ResultSetHeader>(
      'INSERT INTO otp_codes (email, code, type, expires_at, payload) VALUES (?, ?, ?, ?, ?)',
      [email, otp, type, expiresAt, payload]
    );

    const subject = type === 'register' ? 'Verify your Ecosystem account' : 'Password Reset OTP - Ecosystem';
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #f9fafb; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #1C1C1C; color: #F7941D; font-size: 24px; font-weight: 800; padding: 10px 20px;">Ecosystem</div>
        </div>
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 22px;">Your verification code</h2>
          <p style="color: #6B7280; margin: 0 0 24px;">Enter this OTP to ${type === 'register' ? 'complete your registration' : 'reset your password'}. It expires in 5 minutes.</p>
          <div style="text-align: center; background: #F3F4F6; border-radius: 12px; padding: 24px; letter-spacing: 12px; font-size: 36px; font-weight: 800; color: #4F46E5;">${otp}</div>
          <p style="color: #9CA3AF; font-size: 13px; margin: 20px 0 0; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    await sendMail(email, subject, `Your Ecosystem OTP is: ${otp}`, htmlBody);
    
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    next(error);
  }
};


export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, type } = req.body;
    
    if (!email || !code || !type) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, expires_at, is_used, payload FROM otp_codes WHERE email = ? AND code = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [email, code, type]
    );

    const otpRecord = rows[0];

    if (!otpRecord) {
      res.status(400).json({ success: false, error: 'Invalid OTP. Please check and try again.' });
      return;
    }
    if (otpRecord.is_used) {
      res.status(400).json({ success: false, error: 'This OTP has already been used.' });
      return;
    }
    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
      return;
    }

    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRecord.id]);

    // For registration: create the user directly here
    if (type === 'register') {
      if (!otpRecord.payload) {
        res.status(400).json({ success: false, error: 'Registration payload missing. Please start over.' });
        return;
      }

      const { name, phone, role, passwordHash, startup_intent } = typeof otpRecord.payload === 'string'
        ? JSON.parse(otpRecord.payload)
        : otpRecord.payload;

      // Check user doesn't already exist (race condition guard)
      const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        res.status(400).json({ success: false, error: 'Account already exists. Please login.' });
        return;
      }

      await pool.query<ResultSetHeader>(
        'INSERT INTO users (email, password_hash, role, name, phone, startup_intent, is_verified, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, true, true)',
        [email, passwordHash, role || 'student', name, phone || null, startup_intent || null]
      );

      res.json({ success: true, message: 'Account created successfully! You can now log in.' });
      return;
    }

    // For forgot_password: return a short-lived verification token
    const verificationToken = jwt.sign(
      { email, type },
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

export const googleOAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idToken, role, startup_intent } = req.body as {
      idToken?: string;
      role?: string;
      startup_intent?: 'has_startup' | 'finding_startup' | null;
    };

    if (!idToken) {
      res.status(400).json({ success: false, error: 'Google token is required' });
      return;
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!googleClientId) {
      res.status(500).json({ success: false, error: 'Google OAuth is not configured on the server.' });
      return;
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified !== true) {
      res.status(401).json({ success: false, error: 'Unable to verify Google account email.' });
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const googleSub = payload.sub;

    if (!googleSub) {
      res.status(401).json({ success: false, error: 'Invalid Google account payload.' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, role, name FROM users WHERE email = ?', [email]);
    let user = rows[0] as { id: number; email: string; role: string; name: string } | undefined;
    let isNewUser = false;

    if (!user) {
      const assignedRole = role === 'mentor' ? 'mentor' : 'student';
      const startupIntent = assignedRole === 'student' && (startup_intent === 'has_startup' || startup_intent === 'finding_startup')
        ? startup_intent
        : null;

      const randomPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);

      const [insertResult] = await pool.query<ResultSetHeader>(
        `INSERT INTO users
          (email, password_hash, role, name, phone, startup_intent, is_verified, is_email_verified, oauth_provider, oauth_sub)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, 'google', ?)`,
        [email, randomPasswordHash, assignedRole, name, null, startupIntent, googleSub]
      );

      user = { id: insertResult.insertId, email, role: assignedRole, name };
      isNewUser = true;

      if (payload.picture) {
        await pool.query(
          `INSERT INTO user_profiles (user_id, avatar_url)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE avatar_url = VALUES(avatar_url)`,
          [insertResult.insertId, payload.picture]
        );
      }
    } else {
      await pool.query(
        `UPDATE users
         SET oauth_provider = 'google', oauth_sub = ?, is_verified = TRUE, is_email_verified = TRUE
         WHERE id = ?`,
        [googleSub, user.id]
      );
    }

    const authUser = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { user: authUser, accessToken, isNewUser } });
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
      const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.id]);
      const user = rows[0];

      if (!user) {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        res.status(401).json({ success: false, error: 'User no longer exists.' });
        return;
      }

      const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
      const newAccessToken = generateAccessToken(payload);
      
      res.json({ success: true, data: { accessToken: newAccessToken } });
    } catch (err) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      });
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
