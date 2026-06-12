import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { postIdea, getIdeas, upvoteIdea, addFeedback, getIdeaWithFeedback } from '../controllers/ideaController';

const router = Router();
router.use(authenticate);

router.post('/', postIdea);
router.get('/', getIdeas);
router.get('/:id', getIdeaWithFeedback);
router.post('/:id/upvote', upvoteIdea);
router.post('/:id/feedback', addFeedback);

export default router;
