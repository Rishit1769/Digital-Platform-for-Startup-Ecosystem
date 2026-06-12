import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
	getCalendarEvents,
	getGoogleCalendarStatus,
	connectGoogleCalendar,
	disconnectGoogleCalendar,
	getMeetingCandidates,
} from '../controllers/calendarController';
import { getTasks, createTask, updateTask, deleteTask, moveTask } from '../controllers/taskController';

const router = Router();
router.use(authenticate);

router.get('/events', getCalendarEvents);
router.get('/google/status', getGoogleCalendarStatus);
router.post('/google/connect', connectGoogleCalendar);
router.post('/google/disconnect', disconnectGoogleCalendar);
router.get('/meeting-candidates', getMeetingCandidates);

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.patch('/tasks/:id/move', moveTask);
router.delete('/tasks/:id', deleteTask);

export default router;
