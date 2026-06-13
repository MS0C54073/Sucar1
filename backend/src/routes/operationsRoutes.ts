import express from 'express';
import {
  getOperationsDashboard,
  checkInBooking,
  assignNext,
  startBayWash,
  completeBayWash,
  approvePayment,
  rejectPayment,
  assignQueueToBay,
} from '../controllers/operationsController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('carwash', 'admin', 'subadmin'));

router.get('/dashboard', getOperationsDashboard);
router.get('/dashboard/:carWashId', getOperationsDashboard);

router.post('/check-in/:bookingId', checkInBooking);
router.post('/assign-next', assignNext);
router.post('/bays/:bayId/start', startBayWash);
router.post('/bays/:bayId/complete', completeBayWash);
router.post('/queue/:queueId/assign', assignQueueToBay);

router.post('/payments/:bookingId/approve', approvePayment);
router.post('/payments/:bookingId/reject', rejectPayment);

export default router;
