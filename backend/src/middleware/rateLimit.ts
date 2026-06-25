/**
 * Rate-limiting middleware
 *
 * SECURITY: the authentication endpoints (login / register / OAuth / phone OTP)
 * were previously unprotected, leaving them open to credential brute-forcing and
 * OTP enumeration. These limiters cap the number of attempts per client IP.
 *
 * Responses use the same `{ success, message }` shape as the rest of the API so
 * the frontend error handling continues to work unchanged.
 */
import rateLimit, { Options } from 'express-rate-limit';

const MINUTE = 60 * 1000;

const jsonHandler = (message: string): Options['handler'] => (_req, res) => {
  res.status(429).json({ success: false, message });
};

/**
 * General limiter for authentication attempts (login / register / google).
 * 20 requests per 15 minutes per IP — generous for real users, hostile to
 * automated guessing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler('Too many authentication attempts. Please try again later.'),
});

/**
 * Stricter limiter for one-time-code issuance/verification to curb SMS abuse
 * and OTP brute-forcing: 5 requests per 5 minutes per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 5 * MINUTE,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler('Too many verification requests. Please wait a few minutes and try again.'),
});
