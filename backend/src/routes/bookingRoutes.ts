import express from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  markReturnInProgress,
  markOutForDelivery,
} from '../controllers/bookingController';
import { protect } from '../middleware/auth';

const router = express.Router();

const createBookingValidation = [
  body('vehicleId').notEmpty().withMessage('Vehicle ID is required').isUUID().withMessage('Vehicle ID must be a valid UUID'),
  body('carWashId').notEmpty().withMessage('Car Wash ID is required').isUUID().withMessage('Car Wash ID must be a valid UUID'),
  body('serviceId').notEmpty().withMessage('Service ID is required').isUUID().withMessage('Service ID must be a valid UUID'),
  body('bookingType').optional().isIn(['pickup_delivery', 'drive_in']).withMessage('Booking type must be either pickup_delivery or drive_in'),
  body('pickupLocation')
    .optional({ values: 'falsy' })
    .custom((value, { req }) => {
      // If booking type is pickup_delivery, pickupLocation is required
      if (req.body.bookingType === 'pickup_delivery') {
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          throw new Error('Pickup location is required for pickup & delivery bookings');
        }
        if (typeof value === 'string' && value.trim().length < 5) {
          throw new Error('Pickup location must be at least 5 characters');
        }
        if (typeof value === 'string' && value.trim().length > 200) {
          throw new Error('Pickup location must not exceed 200 characters');
        }
      }
      return true;
    }),
  body('pickupCoordinates')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value !== null && value !== undefined && typeof value !== 'object') {
        throw new Error('Pickup coordinates must be an object');
      }
      return true;
    }),
  body('scheduledPickupTime')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        throw new Error('Scheduled pickup time must be a valid ISO 8601 date');
      }
      return true;
    }),
  body('driverId')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        throw new Error('Driver ID must be a valid UUID');
      }
      return true;
    }),
];

router.use(protect);

router.post('/', createBookingValidation, createBooking);
router.get('/', getBookings);
router.get('/:id', getBooking);
router.put('/:id/status', body('status').notEmpty(), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);
router.post('/:id/return-in-progress', markReturnInProgress);
router.post('/:id/out-for-delivery', markOutForDelivery);

export default router;
