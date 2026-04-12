import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createOfficeHour, getMentorOfficeHours, updateOfficeHour, deactivateOfficeHour,
  getAvailableSlots, bookOfficeHour, getMyBookings, cancelBooking 
} from '../controllers/officeHourController';

const router = Router();
router.use(authenticate);

router.post('/', createOfficeHour);
router.get('/mentor/:mentorId', getMentorOfficeHours);
router.put('/:id', updateOfficeHour);
router.delete('/:id', deactivateOfficeHour);

router.get('/available/:mentorId', getAvailableSlots);
router.post('/:id/book', bookOfficeHour);

router.get('/my-bookings', getMyBookings);
router.patch('/bookings/:id/cancel', cancelBooking);

export default router;
