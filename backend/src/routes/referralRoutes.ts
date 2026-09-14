import express from 'express';
import { protect } from '../middleware/auth';
import {
  joinProgram,
  getDashboard,
  leaderboard,
  cashout,
  validateCode,
  affiliateStatus,
  cashoutValidation,
} from '../controllers/referralController';

const router = express.Router();

router.get('/validate/:code', validateCode);
router.use(protect);

router.get('/status', affiliateStatus);
router.post('/join', joinProgram);
router.get('/dashboard', getDashboard);
router.get('/leaderboard', leaderboard);
router.post('/cashout', cashoutValidation, cashout);

export default router;
