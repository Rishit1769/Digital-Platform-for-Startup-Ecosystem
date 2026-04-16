"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const db_1 = require("../db");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = (0, jwt_1.verifyAccessToken)(token);
    if (!decoded) {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
        return;
    }
    try {
        const [rows] = await db_1.pool.query('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.id]);
        const user = rows[0];
        if (!user) {
            res.status(401).json({ success: false, error: 'User no longer exists.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Access denied. You do not have permission.' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
// Alias for single-role checks
const requireRole = (role) => (0, exports.authorize)(role);
exports.requireRole = requireRole;
