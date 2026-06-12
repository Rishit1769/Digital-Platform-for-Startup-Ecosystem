import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { 
  createStartup, getStartups, getHiringStartups, getStartupById, updateStartup, deleteStartup, uploadLogo,
  inviteMember, removeMember, getMembers,
  getMyStartups,
  requestMentorStartupAccess,
  getOutgoingMentorAccessRequests,
  getIncomingMentorAccessRequests,
  approveMentorAccessRequest,
  rejectMentorAccessRequest,
  volunteerAsMentor,
  getIncomingMentorVolunteerRequests,
  approveMentorVolunteerRequest,
  rejectMentorVolunteerRequest,
  analyzePitchDeck,
  generatePitchOutline,
  suggestMilestones,
  createBarterListing,
  getStartupBarterListings,
  getBarterMarketplace,
  getBarterMatches,
  applyForBarter,
  getBarterListingApplications,
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
router.get('/my', getMyStartups);
router.get('/mentor-access-requests/outgoing', getOutgoingMentorAccessRequests);
router.get('/mentor-access-requests/incoming', getIncomingMentorAccessRequests);
router.patch('/mentor-access-requests/:requestId/approve', approveMentorAccessRequest);
router.patch('/mentor-access-requests/:requestId/reject', rejectMentorAccessRequest);
router.get('/mentor-volunteer-requests/incoming', getIncomingMentorVolunteerRequests);
router.patch('/mentor-volunteer-requests/:requestId/approve', approveMentorVolunteerRequest);
router.patch('/mentor-volunteer-requests/:requestId/reject', rejectMentorVolunteerRequest);
router.get('/', getStartups);
router.get('/:id', getStartupById);
router.put('/:id', updateStartup);
router.delete('/:id', deleteStartup);
router.post('/:id/logo', upload.single('logo'), uploadLogo);
router.post('/:id/mentor-access-requests', requestMentorStartupAccess);
router.post('/:id/mentor-volunteer', volunteerAsMentor);

// Team Mgmt
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/members', getMembers);

import { postOpenRole } from '../controllers/roleController';
import { toggleUpvote, checkUpvoteStatus } from '../controllers/showcaseController';

import { submitReview, getStartupReviews } from '../controllers/reviewController';

import { getMilestones, addMilestone, updateMilestone, deleteMilestone } from '../controllers/milestoneController';
import { linkRepo, unlinkRepo, getCachedGitHub, refreshGitHub, getActivityScore, getRepoReadme } from '../controllers/githubController';

router.get('/barter/marketplace', getBarterMarketplace);

router.post('/:id/roles', postOpenRole);
router.post('/:id/upvote', toggleUpvote);
router.get('/:id/upvote', checkUpvoteStatus);
router.post('/:id/reviews', submitReview);
router.get('/:id/reviews', getStartupReviews);

router.get('/:id/milestones', getMilestones);
router.post('/:id/milestones', addMilestone);
router.patch('/:id/milestones/:milId', updateMilestone);
router.delete('/:id/milestones/:milId', deleteMilestone);
router.post('/:id/suggest-milestones', suggestMilestones);

router.post('/:id/analyze-pitch', analyzePitchDeck);
router.post('/:id/generate-outline', generatePitchOutline);

router.post('/:id/barter', createBarterListing);
router.get('/:id/barter', getStartupBarterListings);
router.get('/:id/barter/matches', getBarterMatches);
router.post('/:id/barter/:listingId/apply', applyForBarter);
router.get('/:id/barter/:listingId/applications', getBarterListingApplications);

router.post('/:id/github', linkRepo);
router.delete('/:id/github', unlinkRepo);
router.get('/:id/github', getCachedGitHub);
router.get('/:id/github/refresh', refreshGitHub);
router.get('/:id/activity-score', getActivityScore);
router.get('/:id/github/readme', getRepoReadme);

export default router;
