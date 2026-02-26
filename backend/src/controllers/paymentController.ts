import { Response } from 'express';
import { validationResult } from 'express-validator';
import { DBService } from '../services/db-service';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

// @desc    Initiate payment (client submits proof/transaction)
// @route   POST /api/payments/initiate
// @access  Private
export const initiatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    let { bookingId, method, transactionId } = req.body;

    // Map provider-specific labels to generic enums (schema-safe)
    if (method === 'airtel_money') method = 'mobile_money';

    const booking = await DBService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Verify authorization (normalize relation ids)
    const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
    if (req.user!.role !== 'admin' && bookingClientId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Allow payment after wash completed OR after vehicle delivered to client (legacy-safe)
    if (!['wash_completed', 'delivered_to_client', 'delivered'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: 'Payment is only allowed after service completion or after delivery to client',
      });
      return;
    }

    let payment = await DBService.getPaymentByBookingId(bookingId);

    if (!payment) {
      // Create payment record on first submit
      payment = await DBService.createPayment({
        bookingId,
        amount: booking.totalAmount,
        method,
        transactionId: transactionId || null,
        status: 'pending',
      });
    } else {
      // Update existing payment as pending (awaiting confirmation)
      payment = await DBService.updatePayment(payment.id, {
        method,
        transactionId: transactionId || null,
        status: 'pending',
      });
    }

    // Keep booking payment pending until confirmation by driver or car wash
    await DBService.updateBooking(bookingId, {
      paymentStatus: 'pending',
    });

    // Prompt driver and car wash to confirm payment for cash or mobile money
    if (['cash','mobile_money'].includes(method)) {
      const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
      const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
      const bookingCarWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;

      const title = 'Payment Confirmation Required';
      const message = `Client initiated ${method === 'cash' ? 'Cash' : 'Mobile Money'} payment. Please review and confirm.`;

      if (bookingDriverId) {
        await NotificationService.createNotification({
          userId: bookingDriverId as string,
          type: 'payment',
          title,
          message,
          data: { bookingId },
          priority: 'high',
        });
      }
      if (bookingCarWashId) {
        await NotificationService.createNotification({
          userId: bookingCarWashId as string,
          type: 'payment',
          title,
          message,
          data: { bookingId },
          priority: 'high',
        });
      }
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get payment by booking ID
// @route   GET /api/payments/booking/:bookingId
// @access  Private
export const getPaymentByBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await DBService.getPaymentByBookingId(req.params.bookingId);

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    const booking = await DBService.getBookingById(req.params.bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Verify authorization
    const bookingClientId = typeof booking.clientId === 'object' ? booking.clientId?.id : booking.clientId;
    const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
    const bookingCarWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;
    if (
      req.user!.role !== 'admin' &&
      bookingClientId !== req.user!.id &&
      (bookingDriverId && bookingDriverId !== req.user!.id) &&
      bookingCarWashId !== req.user!.id
    ) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Verify payment (admin)
// @route   POST /api/payments/verify
// @access  Private (Admin)
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId, status } = req.body;

    const payment = await DBService.getPaymentByBookingId(paymentId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    const updatedPayment = await DBService.updatePayment(payment.id, { status });

    if (status === 'completed') {
      const booking = await DBService.getBookingById(payment.bookingId);
      if (booking) {
          const update: any = { paymentStatus: 'paid' };
          // If client already has the vehicle (delivered or delivered_to_client), close the job now per flow
          if (booking.status === 'delivered_to_client' || booking.status === 'delivered') {
            update.status = 'completed';
          }
          await DBService.updateBooking(booking.id, update);
      }
    }

    res.json({
      success: true,
      data: updatedPayment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Confirm payment (Driver or Car Wash)
// @route   POST /api/payments/confirm
// @access  Private (Driver, Car Wash, Admin)
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required' });
      return;
    }

    const booking = await DBService.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Authorization: driver assigned, car wash owner, or admin
    const bookingDriverId = typeof booking.driverId === 'object' ? booking.driverId?.id : booking.driverId;
    const bookingCarWashId = typeof booking.carWashId === 'object' ? booking.carWashId?.id : booking.carWashId;
    const isAuthorized =
      req.user!.role === 'admin' ||
      req.user!.role === 'subadmin' ||
      (req.user!.role === 'driver' && bookingDriverId === req.user!.id) ||
      (req.user!.role === 'carwash' && bookingCarWashId === req.user!.id);

    if (!isAuthorized) {
      res.status(403).json({ success: false, message: 'Not authorized to confirm payment' });
      return;
    }

    // Fetch payment and validate proof
    const payment = await DBService.getPaymentByBookingId(bookingId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    // Proof is optional per requirements; driver/car wash can confirm without transactionId

    const updatedPayment = await DBService.updatePayment(payment.id, {
      status: 'completed',
      paymentDate: new Date().toISOString(),
    });

    const bookingAfter = await DBService.getBookingById(bookingId);
    const bookingUpdate: any = { paymentStatus: 'paid' };
    if (bookingAfter && (bookingAfter.status === 'delivered_to_client' || bookingAfter.status === 'delivered')) {
      bookingUpdate.status = 'completed';
    }
    await DBService.updateBooking(bookingId, bookingUpdate);

    // Notify client that payment was confirmed
    const bookingClientId = typeof bookingAfter?.clientId === 'object' ? bookingAfter?.clientId?.id : bookingAfter?.clientId;
    if (bookingClientId) {
      await NotificationService.createNotification({
        userId: bookingClientId as string,
        type: 'payment_update',
        title: 'Payment Confirmed',
        message: 'Your payment has been confirmed. Thank you!',
        data: { bookingId },
      });
    }

    res.json({ success: true, data: updatedPayment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
