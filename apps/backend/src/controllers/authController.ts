import { Request, Response, NextFunction, type CookieOptions } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma, prisma } from '../db';
import { generateOTP } from '../utils/otp';
import { sendMail } from '../services/email';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const VERIFICATION_SECRET = `${process.env.JWT_SECRET || 'super_secret_jwt_key'}_verification`;
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getRefreshCookieOptions(): CookieOptions {
  const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
  const sameSite: CookieOptions['sameSite'] =
    configuredSameSite === 'lax' || configuredSameSite === 'strict' || configuredSameSite === 'none'
      ? configuredSameSite
      : 'none';

  const secure =
    process.env.COOKIE_SECURE != null
      ? process.env.COOKIE_SECURE === 'true'
      : sameSite === 'none' || process.env.NODE_ENV === 'production';

  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/',
    ...(domain ? { domain } : {}),
  };
}

function getRefreshCookieClearOptions(): CookieOptions {
  const { maxAge, ...cookieOptions } = getRefreshCookieOptions();
  return cookieOptions;
}

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

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (type === 'register' && existingUser) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }
    if (type === 'forgot_password' && !existingUser) {
      res.status(404).json({ success: false, error: 'No account found with this email.' });
      return;
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    let payload: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
    if (type === 'register') {
      const passwordHash = await bcrypt.hash(password, 12);
      payload = JSON.stringify({ name, phone, role: role || 'student', passwordHash, startup_intent: startup_intent || null });
    } else {
      payload = Prisma.JsonNull;
    }

    await prisma.otpCode.updateMany({
      where: { email, type, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.otpCode.create({
      data: { email, code: otp, type, expiresAt, payload },
    });

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

    const otpRecord = await prisma.otpCode.findFirst({
      where: { email, code, type },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, error: 'Invalid OTP. Please check and try again.' });
      return;
    }
    if (otpRecord.isUsed) {
      res.status(400).json({ success: false, error: 'This OTP has already been used.' });
      return;
    }
    if (otpRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
      return;
    }

    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });

    if (type === 'register') {
      if (!otpRecord.payload) {
        res.status(400).json({ success: false, error: 'Registration payload missing. Please start over.' });
        return;
      }

      const { name, phone, role, passwordHash, startup_intent } =
        typeof otpRecord.payload === 'string'
          ? JSON.parse(otpRecord.payload as string)
          : (otpRecord.payload as any);

      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        res.status(400).json({ success: false, error: 'Account already exists. Please login.' });
        return;
      }

      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: role || 'student',
          name,
          phone: phone || null,
          startupIntent: startup_intent || null,
          isVerified: true,
          isEmailVerified: true,
        },
      });

      res.json({ success: true, message: 'Account created successfully! You can now log in.' });
      return;
    }

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

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    const user = await prisma.user.create({
      data: { email, passwordHash, role: assignedRole, name, isVerified: true, isEmailVerified: true },
      select: { id: true, email: true, role: true, name: true },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

    res.json({ success: true, data: { user: payload, accessToken } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'No refresh token' });
      return;
    }

    try {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key');
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, name: true },
      });

      if (!user) {
        res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
        res.status(401).json({ success: false, error: 'User no longer exists.' });
        return;
      }

      const newAccessToken = generateAccessToken(user);
      res.json({ success: true, data: { accessToken: newAccessToken } });
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieClearOptions());
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
    await prisma.user.update({ where: { email }, data: { passwordHash } });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
