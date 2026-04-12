import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getLeaderboardStudents, 
  getLeaderboardMentors, 
  getLeaderboardStartups, 
  getMyRank, 
  getMyGamification, 
  getUserGamification, 
  getMyXPHistory 
} from '../controllers/gamificationController';

const router = Router();

// Gamification Profiles (public ok for getUserGamification)
router.get('/gamification/user/:userId', getUserGamification);

// Requires Auth
router.use(authenticate);

router.get('/leaderboard/students', getLeaderboardStudents);
router.get('/leaderboard/mentors', getLeaderboardMentors);
router.get('/leaderboard/startups', getLeaderboardStartups);
router.get('/leaderboard/my-rank', getMyRank);

router.get('/gamification/me', getMyGamification);
router.get('/gamification/me/history', getMyXPHistory);

export default router;
