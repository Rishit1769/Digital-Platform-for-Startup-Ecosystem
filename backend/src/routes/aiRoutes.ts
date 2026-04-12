import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { recommendMentors, recommendCofounders, getTrendRadar, suggestPivot, getPitchDeck, generatePitchDeck } from '../controllers/aiController';

const router = Router();

// Cache driven mostly
router.get('/trend-radar', getTrendRadar);

// Auth Required
router.use(authenticate);

router.get('/recommend-mentors', recommendMentors);
router.get('/recommend-cofounders', recommendCofounders);

router.post('/trend-radar/suggest-pivot', suggestPivot);

// SSE Streaming using standard fetch API supporting POST headers
router.get('/pitch/:startupId', getPitchDeck);
router.post('/pitch/:startupId/generate', generatePitchDeck);
router.post('/pitch/:startupId/regenerate', generatePitchDeck);

export default router;
