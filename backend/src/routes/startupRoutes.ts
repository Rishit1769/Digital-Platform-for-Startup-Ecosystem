import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { 
  createStartup, getStartups, getHiringStartups, getStartupById, updateStartup, deleteStartup, uploadLogo,
  inviteMember, removeMember, getMembers 
} from '../controllers/startupController';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.use(authenticate);

// CRUD
router.post('/', createStartup);
router.get('/hiring', getHiringStartups);
router.get('/', getStartups);
router.get('/:id', getStartupById);
router.put('/:id', updateStartup);
router.delete('/:id', deleteStartup);
router.post('/:id/logo', upload.single('logo'), uploadLogo);

// Team Mgmt
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/members', getMembers);

import { postOpenRole } from '../controllers/roleController';
import { toggleUpvote, checkUpvoteStatus } from '../controllers/showcaseController';

import { submitReview, getStartupReviews } from '../controllers/reviewController';

import { getMilestones, addMilestone, updateMilestone, deleteMilestone } from '../controllers/milestoneController';
import { linkRepo, unlinkRepo, getCachedGitHub, refreshGitHub, getActivityScore } from '../controllers/githubController';

router.post('/:id/roles', postOpenRole);
router.post('/:id/upvote', toggleUpvote);
router.get('/:id/upvote', checkUpvoteStatus);
router.post('/:id/reviews', submitReview);
router.get('/:id/reviews', getStartupReviews);

router.get('/:id/milestones', getMilestones);
router.post('/:id/milestones', addMilestone);
router.patch('/:id/milestones/:milId', updateMilestone);
router.delete('/:id/milestones/:milId', deleteMilestone);

router.post('/:id/github', linkRepo);
router.delete('/:id/github', unlinkRepo);
router.get('/:id/github', getCachedGitHub);
router.get('/:id/github/refresh', refreshGitHub);
router.get('/:id/activity-score', getActivityScore);

export default router;
