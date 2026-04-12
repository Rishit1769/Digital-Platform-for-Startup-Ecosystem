"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.logout = exports.refresh = exports.login = exports.register = exports.verifyOtp = exports.sendOtp = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const otp_1 = require("../utils/otp");
const email_1 = require("../services/email");
const jwt_1 = require("../utils/jwt");
const xpService_1 = require("../services/xpService");
const VERIFICATION_SECRET = process.env.JWT_SECRET + '_verification';
const sendOtp = async (req, res, next) => {
    try {
        const { email, role, type } = req.body;
        if (!email || !type) {
            res.status(400).json({ success: false, error: 'Email and type are required' });
            return;
        }
        const [existingUsers] = await db_1.pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (type === 'register' && existingUsers.length > 0) {
            res.status(400).json({ success: false, error: 'User already exists' });
            return;
        }
        if (type === 'forgot_password' && existingUsers.length === 0) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        const otp = (0, otp_1.generateOTP)();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
        await db_1.pool.query('INSERT INTO otp_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)', [email, otp, type, expiresAt]);
        const subject = type === 'register' ? 'Your Registration OTP - CloudCampus' : 'Password Reset OTP - CloudCampus';
        const htmlBody = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>CloudCampus</h2>
        <p>Your one-time password is:</p>
        <h1 style="font-size: 36px; letter-spacing: 5px; color: #4F46E5;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `;
        await (0, email_1.sendMail)(email, subject, `Your OTP is ${otp}`, htmlBody);
        res.json({ success: true, message: 'OTP sent successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res, next) => {
    try {
        const { email, code, type, role } = req.body;
        if (!email || !code || !type) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const [rows] = await db_1.pool.query('SELECT id, expires_at, is_used FROM otp_codes WHERE email = ? AND code = ? AND type = ? ORDER BY created_at DESC LIMIT 1', [email, code, type]);
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
        await db_1.pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRecord.id]);
        const verificationToken = jsonwebtoken_1.default.sign({ email, type, role }, // Storing role here so it can be used during registration
        VERIFICATION_SECRET, { expiresIn: '10m' });
        res.json({ success: true, data: { verificationToken } });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyOtp = verifyOtp;
const register = async (req, res, next) => {
    try {
        const { email, name, password, verificationToken } = req.body;
        if (!email || !name || !password || !verificationToken) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(verificationToken, VERIFICATION_SECRET);
        }
        catch (err) {
            res.status(401).json({ success: false, error: 'Invalid or expired verification token' });
            return;
        }
        if (decoded.email !== email || decoded.type !== 'register') {
            res.status(400).json({ success: false, error: 'Token mismatch' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const assignedRole = decoded.role || 'student';
        const [existingUsers] = await db_1.pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            res.status(400).json({ success: false, error: 'User already exists' });
            return;
        }
        const [result] = await db_1.pool.query('INSERT INTO users (email, password_hash, role, name, is_verified, is_email_verified) VALUES (?, ?, ?, ?, true, true)', [email, passwordHash, assignedRole, name]);
        const user = { id: result.insertId, email, role: assignedRole, name };
        const accessToken = (0, jwt_1.generateAccessToken)(user);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.json({ success: true, data: { user, accessToken } });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, error: 'Email and password required' });
            return;
        }
        const [rows] = await db_1.pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user || !(await bcrypt_1.default.compare(password, user.password_hash))) {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
            return;
        }
        let xpRes;
        const [logins] = await db_1.pool.query('SELECT COUNT(*) as c FROM xp_events WHERE user_id = ? AND event_type IN ("first_login", "daily_login") AND DATE(created_at) = CURDATE()', [user.id]);
        if (logins[0].c === 0) {
            const [allLogins] = await db_1.pool.query('SELECT COUNT(*) as c FROM xp_events WHERE user_id = ? AND event_type = "first_login"', [user.id]);
            if (allLogins[0].c === 0) {
                xpRes = await (0, xpService_1.awardXP)(user.id, 'first_login');
            }
            else {
                xpRes = await (0, xpService_1.awardXP)(user.id, 'daily_login');
            }
        }
        const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({ success: true, data: { user: payload, accessToken } });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ success: false, error: 'No refresh token' });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key');
            const payload = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
            const newAccessToken = (0, jwt_1.generateAccessToken)(payload);
            res.json({ success: true, data: { accessToken: newAccessToken } });
        }
        catch (err) {
            res.status(401).json({ success: false, error: 'Invalid refresh token' });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const resetPassword = async (req, res, next) => {
    try {
        const { email, password, verificationToken } = req.body;
        if (!email || !password || !verificationToken) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(verificationToken, VERIFICATION_SECRET);
        }
        catch (err) {
            res.status(401).json({ success: false, error: 'Invalid or expired token' });
            return;
        }
        if (decoded.email !== email || decoded.type !== 'forgot_password') {
            res.status(400).json({ success: false, error: 'Token mismatch' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        await db_1.pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
