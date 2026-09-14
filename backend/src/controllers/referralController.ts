import { Response } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../shared/errors/errorHandler';
import { BadRequestError } from '../shared/errors/AppError';
import {
  joinAffiliateProgram,
  getDashboardStats,
  getLeaderboard,
  requestCashout,
  getAffiliateByUserId,
  getAffiliateByCode,
} from '../services/referralService';

const AFFILIATE_ROLES = ['client', 'driver'];

// @route   POST /api/referrals/join
// @desc    Opt in to the SuCAR referral program
export const joinProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw new BadRequestError('Not authenticated');
  if (!AFFILIATE_ROLES.includes(req.user.role)) {
    throw new BadRequestError('Only clients and drivers can join the referral program');
  }

  const affiliate = await joinAffiliateProgram(req.user.id, req.user.name);
  const dashboard = await getDashboardStats(req.user.id);

  res.json({ success: true, data: { affiliate, dashboard } });
});

// @route   GET /api/referrals/dashboard
// @desc    Referral dashboard stats for the logged-in user
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw new BadRequestError('Not authenticated');
  const dashboard = await getDashboardStats(req.user.id);
  res.json({ success: true, data: dashboard });
});

// @route   GET /api/referrals/leaderboard
// @desc    Top referrers in the last 30 days
export const leaderboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const leaders = await getLeaderboard(10);
  res.json({ success: true, data: leaders });
});

// @route   POST /api/referrals/cashout
// @desc    Request a cashout of referral earnings
export const cashout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw new BadRequestError('Not authenticated');
  const amount = req.body.amount ? Number(req.body.amount) : undefined;
  const result = await requestCashout(req.user.id, amount);
  res.json({ success: true, data: result, message: 'Cashout request submitted. We will process it within 3 business days.' });
});

// @route   GET /api/referrals/validate/:code
// @desc    Public-ish validation of a referral code (for registration UI)
export const validateCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = req.params.code;
  if (!code) throw new BadRequestError('Referral code is required');
  const affiliate = await getAffiliateByCode(code);
  res.json({
    success: true,
    data: {
      valid: Boolean(affiliate),
      code: affiliate?.referral_code || null,
    },
  });
});

// @route   GET /api/referrals/status
// @desc    Quick check if user is enrolled
export const affiliateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw new BadRequestError('Not authenticated');
  const affiliate = await getAffiliateByUserId(req.user.id);
  res.json({
    success: true,
    data: {
      isAffiliate: Boolean(affiliate),
      referralCode: affiliate?.referral_code || null,
      canJoin: AFFILIATE_ROLES.includes(req.user.role),
    },
  });
});

export const cashoutValidation = [
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
];
