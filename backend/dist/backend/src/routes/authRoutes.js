"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/send-otp', authController_1.sendOtp);
router.post('/verify-otp', authController_1.verifyOtp);
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/oauth/google', authController_1.googleOAuth);
router.post('/refresh', authController_1.refresh);
router.post('/logout', authController_1.logout);
router.patch('/reset-password', authController_1.resetPassword);
// Example protected route for testing
router.get('/me', auth_1.authenticate, (req, res) => {
    res.json({ success: true, data: req.user });
});
exports.default = router;
