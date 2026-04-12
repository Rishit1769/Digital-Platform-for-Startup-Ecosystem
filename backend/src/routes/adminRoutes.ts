import { Router } from 'express';
import { getVerificationRequests, verifyUser, revokeVerification } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/verification-requests', getVerificationRequests);
router.post('/verify/:userId', verifyUser);
router.delete('/verify/:userId', revokeVerification);

export default router;
