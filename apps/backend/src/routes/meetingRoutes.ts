import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createMeeting, getMeetings, getMeetingDetail, confirmMeeting, setMeetingStatus, rescheduleMeeting, scheduleMeetingDirect
} from '../controllers/meetingController';

const router = Router();
router.use(authenticate);

router.post('/', createMeeting);
router.post('/schedule', scheduleMeetingDirect);
router.get('/', getMeetings);
router.get('/:id', getMeetingDetail);
router.patch('/:id/confirm', confirmMeeting);
router.patch('/:id/reject', (req, res, next) => { Object.assign(req.params, { action: 'reject' }); setMeetingStatus(req, res, next); });
router.patch('/:id/cancel', (req, res, next) => { Object.assign(req.params, { action: 'cancel' }); setMeetingStatus(req, res, next); });
router.patch('/:id/complete', (req, res, next) => { Object.assign(req.params, { action: 'complete' }); setMeetingStatus(req, res, next); });
router.patch('/:id/reschedule', rescheduleMeeting);

export default router;
