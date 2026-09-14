import express from 'express';
import {
  getQueue,
  getBookingQueuePosition,
  addToQueue,
  startService,
  completeService,
  updateServiceDuration,
} from '../controllers/queueController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/carwash/:carWashId', authorize('carwash', 'admin', 'subadmin'), getQueue);
router.get('/booking/:bookingId', getBookingQueuePosition);
router.post('/add', authorize('carwash'), addToQueue);
router.put('/:queueId/start', authorize('carwash', 'admin', 'subadmin'), startService);
router.put('/:queueId/complete', authorize('carwash', 'admin', 'subadmin'), completeService);
router.put('/:queueId/duration', authorize('carwash', 'admin', 'subadmin'), updateServiceDuration);

export default router;
