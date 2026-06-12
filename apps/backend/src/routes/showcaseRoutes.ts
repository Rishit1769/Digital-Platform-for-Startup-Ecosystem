import { Router } from 'express';
import { getShowcase } from '../controllers/showcaseController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getShowcase);

export default router;
