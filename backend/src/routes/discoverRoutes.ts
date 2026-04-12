import { Router } from 'express';
import { discoverUsers } from '../controllers/discoverController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/users', discoverUsers);

export default router;
