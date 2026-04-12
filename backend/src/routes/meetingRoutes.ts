import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createMeeting, getMeetings, getMeetingDetail, confirmMeeting, setMeetingStatus, rescheduleMeeting 
} from '../controllers/meetingController';

const router = Router();
router.use(authenticate);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingDetail);
router.patch('/:id/confirm', confirmMeeting);
router.patch('/:id/:action', setMeetingStatus); // handles reject, cancel, complete natively via path param validation inside controller (reject, cancel, complete)
router.patch('/:id/reschedule', rescheduleMeeting); // Actually this will collide with :action. Better explicit routes:

const router2 = Router();
router2.use(authenticate);
router2.post('/', createMeeting);
router2.get('/', getMeetings);
router2.get('/:id', getMeetingDetail);
router2.patch('/:id/confirm', confirmMeeting);
router2.patch('/:id/reject', (req: any, res, next) => { req.params.action = 'reject'; setMeetingStatus(req, res, next); });
router2.patch('/:id/cancel', (req: any, res, next) => { req.params.action = 'cancel'; setMeetingStatus(req, res, next); });
router2.patch('/:id/complete', (req: any, res, next) => { req.params.action = 'complete'; setMeetingStatus(req, res, next); });
router2.patch('/:id/reschedule', rescheduleMeeting);

export default router2;
