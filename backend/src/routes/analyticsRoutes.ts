import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getEcosystemHealth, getStartupAnalytics, getMentorImpact, getCronSnapshots } from '../controllers/analyticsController';

const router = Router();
router.use(authenticate);

router.get('/ecosystem', getEcosystemHealth);
router.get('/ecosystem/snapshots', getCronSnapshots);
router.get('/startup/:id', getStartupAnalytics);
router.get('/mentor/:mentorId', getMentorImpact);

export default router;
