import { Router } from 'express';
import { sendOtp, verifyOtp, register, login, refresh, logout, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.patch('/reset-password', resetPassword);

// Example protected route for testing
router.get('/me', authenticate, (req: any, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
