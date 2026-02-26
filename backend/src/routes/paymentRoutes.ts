import express from 'express';
import { body } from 'express-validator';
import {
  initiatePayment,
  getPaymentByBooking,
  verifyPayment,
  confirmPayment,
} from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

const paymentValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('method').isIn(['cash', 'card', 'mobile_money', 'bank_transfer']).withMessage('Invalid payment method'),
];

router.use(protect);

router.post('/initiate', paymentValidation, initiatePayment);
router.get('/booking/:bookingId', getPaymentByBooking);
router.post('/verify', authorize('admin'), body('paymentId').notEmpty(), body('status').isIn(['completed', 'failed']), verifyPayment);
router.post('/confirm', authorize('driver', 'carwash', 'admin', 'subadmin'), body('bookingId').notEmpty(), confirmPayment);

export default router;
