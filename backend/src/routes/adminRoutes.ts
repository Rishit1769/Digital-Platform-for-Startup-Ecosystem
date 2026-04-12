import { Router } from 'express';
import {
  getVerificationRequests, verifyUser, revokeVerification,
  listPublicSessions, createPublicSession, deletePublicSession, togglePublicSession,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/verification-requests', getVerificationRequests);
router.post('/verify/:userId', verifyUser);
router.delete('/verify/:userId', revokeVerification);

// Public mentor sessions management
router.get('/public-sessions',              listPublicSessions);
router.post('/public-sessions',             createPublicSession);
router.delete('/public-sessions/:id',       deletePublicSession);
router.patch('/public-sessions/:id/toggle', togglePublicSession);

export default router;
