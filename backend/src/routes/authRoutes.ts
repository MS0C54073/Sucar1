import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateProfile, googleLogin, sendOTP, verifyOTP, changePassword } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('nrc').trim().notEmpty().withMessage('NRC is required'),
  // SECURITY: 'admin'/'subadmin' are intentionally excluded — privileged roles
  // cannot be self-assigned through public registration.
  body('role').isIn(['client', 'driver', 'carwash']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google', authLimiter, googleLogin);
router.post('/phone/send-code', otpLimiter, sendOTP);
router.post('/phone/verify', otpLimiter, verifyOTP);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;
