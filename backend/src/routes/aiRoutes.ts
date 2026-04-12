import { Router } from 'express';
import { getTrendRadar } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/trend-radar', getTrendRadar);

export default router;
