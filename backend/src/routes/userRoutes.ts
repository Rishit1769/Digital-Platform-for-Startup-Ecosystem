import { Router } from 'express';
import { getUserReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/:userId/reviews', getUserReviews);

export default router;
