import { Router } from 'express';
import { getDashboardFeed } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/feed', getDashboardFeed);

export default router;
