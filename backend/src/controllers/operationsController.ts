import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ForbiddenError } from '../shared/errors/AppError';
import { QueueEngineService } from '../services/queueEngineService';

function resolveCarWashId(req: AuthRequest): string {
  if (req.user!.role === 'carwash') return req.user!.id;
  return (req.params.carWashId || req.body.carWashId) as string;
}

function assertCarWashAccess(req: AuthRequest, carWashId: string) {
  if (req.user!.role === 'admin' || req.user!.role === 'subadmin') return;
  if (req.user!.role === 'carwash' && req.user!.id === carWashId) return;
  throw new ForbiddenError('Not authorized for this car wash');
}

/** GET /api/operations/dashboard */
export const getOperationsDashboard = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const carWashId = resolveCarWashId(req);
    assertCarWashAccess(req, carWashId);
    const data = await QueueEngineService.getOperationsDashboard(carWashId);
    res.json({ success: true, data });
  }
);

/** POST /api/operations/check-in/:bookingId */
export const checkInBooking = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const carWashId = resolveCarWashId(req);
    assertCarWashAccess(req, carWashId);
    const { priority, isExpress, durationMinutes } = req.body;
    const result = await QueueEngineService.checkIn(req.params.bookingId, carWashId, {
      priority,
      isExpress,
      durationMinutes,
    });
    res.json({ success: true, data: result });
  }
);

/** POST /api/operations/assign-next */
export const assignNext = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const carWashId = resolveCarWashId(req);
  assertCarWashAccess(req, carWashId);
  const result = await QueueEngineService.tryAssignNextBay(carWashId);
  res.json({ success: true, data: result });
});

/** POST /api/operations/bays/:bayId/start */
export const startBayWash = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const carWashId = resolveCarWashId(req);
  assertCarWashAccess(req, carWashId);
  const result = await QueueEngineService.startWashOnBay(carWashId, req.params.bayId);
  res.json({ success: true, data: result });
});

/** POST /api/operations/bays/:bayId/complete */
export const completeBayWash = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const carWashId = resolveCarWashId(req);
    assertCarWashAccess(req, carWashId);
    const result = await QueueEngineService.completeWashOnBay(carWashId, req.params.bayId);
    res.json({ success: true, data: result });
  }
);

/** POST /api/operations/payments/:bookingId/approve */
export const approvePayment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await QueueEngineService.approvePayment(
      req.params.bookingId,
      req.user!.id
    );
    res.json({ success: true, data: result });
  }
);

/** POST /api/operations/payments/:bookingId/reject */
export const rejectPayment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { reason } = req.body;
    if (!reason?.trim()) {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }
    const result = await QueueEngineService.rejectPayment(
      req.params.bookingId,
      req.user!.id,
      reason.trim()
    );
    res.json({ success: true, data: result });
  }
);

/** POST /api/operations/queue/:queueId/assign */
export const assignQueueToBay = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const carWashId = resolveCarWashId(req);
    const { bayId } = req.body;
    if (!bayId) {
      res.status(400).json({ success: false, message: 'bayId is required' });
      return;
    }
    assertCarWashAccess(req, carWashId);
    const result = await QueueEngineService.assignQueueEntryToBay(
      carWashId,
      req.params.queueId,
      bayId
    );
    res.json({ success: true, data: result });
  }
);
