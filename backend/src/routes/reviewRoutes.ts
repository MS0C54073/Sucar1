import express from 'express';
import {
  submitReview,
  getMyBookingReview,
  getCarWashReviews,
  getDriverReviews,
} from '../controllers/reviewController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// Clients submit and read their own booking review
router.post('/', authorize('client'), submitReview);
router.get('/booking/:bookingId', getMyBookingReview);

// Rating summaries (any authenticated user)
router.get('/carwash/:carWashId', getCarWashReviews);
router.get('/driver/:driverId', getDriverReviews);

export default router;
