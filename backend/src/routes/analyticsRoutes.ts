import { Router } from 'express';
import { getSkillGaps } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/skill-gaps', getSkillGaps);

export default router;
