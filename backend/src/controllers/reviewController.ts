import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../shared/errors/errorHandler';
import {
  createReview,
  getBookingReview,
  getReviewsForUser,
} from '../services/reviewService';

/** POST /api/reviews — client leaves a review for a completed booking */
export const submitReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookingId, carWashRating, driverRating, comment } = req.body;

  if (!bookingId) {
    res.status(400).json({ success: false, message: 'bookingId is required' });
    return;
  }

  const review = await createReview({
    bookingId,
    clientId: req.user!.id,
    carWashRating,
    driverRating,
    comment,
  });

  res.status(201).json({ success: true, data: review });
});

/** GET /api/reviews/booking/:bookingId — the current client's review for a booking */
export const getMyBookingReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const review = await getBookingReview(req.params.bookingId, req.user!.id);
    res.json({ success: true, data: review });
  }
);

/** GET /api/reviews/carwash/:carWashId — public rating summary for a car wash */
export const getCarWashReviews = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const summary = await getReviewsForUser(req.params.carWashId, 'carwash');
    res.json({ success: true, data: summary });
  }
);

/** GET /api/reviews/driver/:driverId — rating summary for a driver */
export const getDriverReviews = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const summary = await getReviewsForUser(req.params.driverId, 'driver');
    res.json({ success: true, data: summary });
  }
);
