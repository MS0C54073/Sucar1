import { Response } from 'express';
import { DBService } from '../services/db-service';
import { AuthRequest } from '../middleware/auth';
import { canModifyUser, canChangeRole } from '../middleware/permissions';
import { AuditService } from '../services/audit-service';
import { FeatureFlagService } from '../services/feature-flag-service';
import { ComplianceService } from '../services/compliance-service';
import { IncidentService } from '../services/incident-service';
import { LogService } from '../services/logService';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError
} from '../shared/errors/AppError';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ApiSuccessResponse } from '../shared/types/api.types';

/**
 * @desc    Get system logs
 * @route   GET /api/admin/logs
 * @access  Private (Super Admin)
 */
export const getSystemLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // Only super_admin or admin with specific permissions can view logs
  // For now, let's say only super_admin or main 'admin' role (not subadmin)
  if (req.user!.role !== 'admin' && req.user!.adminLevel !== 'super_admin') {
    throw new ForbiddenError('Only main admins can view system logs');
  }

  const { limit, offset } = req.query;
  const result = await LogService.getLogs(
    limit ? parseInt(limit as string) : 100,
    offset ? parseInt(offset as string) : 0
  );

  const response: ApiSuccessResponse = {
    success: true,
    data: result,
  };

  res.json(response);
});


// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  const bookings = await DBService.getBookings();
  const users = await DBService.getAllUsers();
  const stats = await DBService.getBookingStats();

  if (!Array.isArray(bookings) || !Array.isArray(users) || !Array.isArray(stats)) {
    throw new InternalServerError('Invalid data format received from database');
  }

  const totalRevenue = Math.round(
    stats
      .filter((b: any) => b.paymentStatus === 'paid')
      .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0) * 100
  ) / 100;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrend: { month: string; bookings: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const inMonth = bookings.filter((b: any) => {
      const raw = b.createdAt || b.created_at;
      if (!raw) return false;
      const bd = new Date(raw);
      return bd.getFullYear() === y && bd.getMonth() === m;
    });
    monthlyTrend.push({
      month: monthNames[m],
      bookings: inMonth.length,
      revenue: Math.round(
        inMonth
          .filter((b: any) => b.paymentStatus === 'paid')
          .reduce((s: number, b: any) => s + parseFloat(b.totalAmount || 0), 0) * 100,
      ) / 100,
    });
  }

  const recentTransactions = [...bookings]
    .sort((a: any, b: any) => {
      const ta = new Date(a.createdAt || a.created_at || 0).getTime();
      const tb = new Date(b.createdAt || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, 8)
    .map((b: any, idx: number) => ({
      id: b.id || b._id,
      transactionId: `TRX-${String(b.id || b._id || idx).slice(0, 8).toUpperCase()}`,
      userName: b.clientId?.name || 'Client',
      userEmail: b.clientId?.email || '',
      amount: parseFloat(b.totalAmount || 0),
      date: b.createdAt || b.created_at,
      paymentStatus: b.paymentStatus || 'pending',
      status: b.status,
    }));

  const response: ApiSuccessResponse = {
    success: true,
    data: {
      totalBookings: bookings.length,
      pendingPickups: bookings.filter((b: any) => ['pending', 'accepted', 'picked_up'].includes(b.status)).length,
      completedWashes: bookings.filter((b: any) => b.status === 'completed' || b.status === 'wash_completed').length,
      totalRevenue,
      totalClients: users.filter((u: any) => u.role === 'client').length,
      totalDrivers: users.filter((u: any) => u.role === 'driver').length,
      totalCarWashes: users.filter((u: any) => u.role === 'carwash').length,
      monthlyTrend,
      recentTransactions,
    },
  };

  res.json(response);
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  const { role } = req.query;
  const users = await DBService.getAllUsers(role as string);

  if (!Array.isArray(users)) {
    throw new InternalServerError('Invalid data format received from database');
  }

  const response: ApiSuccessResponse = {
    success: true,
    count: users.length,
    data: users.map((u: any) => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    }),
  };

  res.json(response);
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('User ID is required');
  }

  const user = await DBService.findUserById(req.params.id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { password, ...userWithoutPassword } = user;

  const response: ApiSuccessResponse = {
    success: true,
    data: userWithoutPassword,
  };

  res.json(response);
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('User ID is required');
  }

  const targetUser = await DBService.findUserById(req.params.id);

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  // Check permissions
  if (!canModifyUser(req.user, targetUser)) {
    throw new ForbiddenError('You do not have permission to modify this user');
  }

  // Check role change permission
  if (req.body.role && req.body.role !== targetUser.role) {
    if (!canChangeRole(req.user, req.body.role)) {
      throw new ForbiddenError('You do not have permission to change user roles');
    }
  }

  // Handle suspension
  if (req.body.isSuspended !== undefined) {
    const updateData: any = {
      isSuspended: req.body.isSuspended,
    };

    if (req.body.isSuspended) {
      updateData.suspendedAt = new Date().toISOString();
      updateData.suspendedBy = req.user.id;
      updateData.suspensionReason = req.body.suspensionReason || 'Suspended by admin';
    } else {
      updateData.suspendedAt = null;
      updateData.suspendedBy = null;
      updateData.suspensionReason = null;
    }

    Object.assign(req.body, updateData);
  }

  // Handle admin level changes (only super_admin can do this)
  if (req.body.adminLevel && req.user.adminLevel !== 'super_admin') {
    delete req.body.adminLevel;
  }

  const user = await DBService.updateUser(req.params.id, req.body);

  if (!user) {
    throw new InternalServerError('Failed to update user');
  }

  // Log the update
  try {
    await AuditService.log(
      req.user.id,
      'user_updated',
      'user',
      `Updated user ${targetUser.name} (${targetUser.email})`,
      {
        entityId: targetUser.id,
        oldValue: targetUser,
        newValue: user,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );
  } catch (auditError) {
    console.error('Failed to log audit:', auditError);
    // Don't fail the request if audit logging fails
  }

  const { password, ...userWithoutPassword } = user;

  const response: ApiSuccessResponse = {
    success: true,
    data: userWithoutPassword,
  };

  res.json(response);
});

// @desc    Suspend user
// @route   POST /api/admin/users/:id/suspend
// @access  Private (Admin)
export const suspendUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('User ID is required');
  }

  const targetUser = await DBService.findUserById(req.params.id);

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (!canModifyUser(req.user, targetUser)) {
    throw new ForbiddenError('You do not have permission to suspend this user');
  }

  const { reason } = req.body;
  const user = await DBService.updateUser(req.params.id, {
    isSuspended: true,
    suspendedAt: new Date().toISOString(),
    suspendedBy: req.user.id,
    suspensionReason: reason || 'Suspended by admin',
  });

  if (!user) {
    throw new InternalServerError('Failed to suspend user');
  }

  // Log the suspension
  try {
    await AuditService.log(
      req.user.id,
      'user_suspended',
      'user',
      `Suspended user ${targetUser.name} (${targetUser.email}): ${reason || 'No reason provided'}`,
      {
        entityId: targetUser.id,
        oldValue: { isSuspended: false },
        newValue: { isSuspended: true, suspensionReason: reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );
  } catch (auditError) {
    console.error('Failed to log audit:', auditError);
  }

  const { password, ...userWithoutPassword } = user;

  const response: ApiSuccessResponse = {
    success: true,
    data: userWithoutPassword,
    message: 'User suspended successfully',
  };

  res.json(response);
});

// @desc    Reactivate user
// @route   POST /api/admin/users/:id/reactivate
// @access  Private (Admin)
export const reactivateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('User ID is required');
  }

  const targetUser = await DBService.findUserById(req.params.id);

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (!canModifyUser(req.user, targetUser)) {
    throw new ForbiddenError('You do not have permission to reactivate this user');
  }

  const user = await DBService.updateUser(req.params.id, {
    isSuspended: false,
    isActive: true,
    suspendedAt: null,
    suspendedBy: null,
    suspensionReason: null,
  });

  if (!user) {
    throw new InternalServerError('Failed to reactivate user');
  }

  // Log the reactivation
  try {
    await AuditService.log(
      req.user.id,
      'user_reactivated',
      'user',
      `Reactivated user ${targetUser.name} (${targetUser.email})`,
      {
        entityId: targetUser.id,
        oldValue: { isSuspended: true },
        newValue: { isSuspended: false },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );
  } catch (auditError) {
    console.error('Failed to log audit:', auditError);
  }

  const { password, ...userWithoutPassword } = user;

  const response: ApiSuccessResponse = {
    success: true,
    data: userWithoutPassword,
    message: 'User reactivated successfully',
  };

  res.json(response);
});

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('User ID is required');
  }

  const targetUser = await DBService.findUserById(req.params.id);

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (!canModifyUser(req.user, targetUser)) {
    throw new ForbiddenError('You do not have permission to delete this user');
  }

  // Soft delete - set isActive to false
  const updatedUser = await DBService.updateUser(req.params.id, { isActive: false });

  if (!updatedUser) {
    throw new InternalServerError('Failed to deactivate user');
  }

  // Log the deletion
  try {
    await AuditService.log(
      req.user.id,
      'user_deleted',
      'user',
      `Deactivated user ${targetUser.name} (${targetUser.email})`,
      {
        entityId: targetUser.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );
  } catch (auditError) {
    console.error('Failed to log audit:', auditError);
  }

  const response: ApiSuccessResponse = {
    success: true,
    data: { id: targetUser.id },
    message: 'User deactivated successfully',
  };

  res.json(response);
});

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const bookings = await DBService.getBookings(filters);

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Assign driver to booking
// @route   PUT /api/admin/bookings/:id/assign-driver
// @access  Private (Admin)
export const assignDriver = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  if (!req.params.id) {
    throw new BadRequestError('Booking ID is required');
  }

  const { driverId } = req.body;

  if (!driverId) {
    throw new BadRequestError('Driver ID is required');
  }

  const booking = await DBService.getBookingById(req.params.id);

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Verify driver exists and is available
  const driver = await DBService.findUserById(driverId);
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  if (driver.role !== 'driver') {
    throw new BadRequestError('User is not a driver');
  }

  if (driver.isActive === false) {
    throw new BadRequestError('Driver is not active');
  }

  const updateData: any = { driverId };
  if (booking.status === 'pending') {
    updateData.status = 'accepted';
  }

  const updatedBooking = await DBService.updateBooking(req.params.id, updateData);

  if (!updatedBooking) {
    throw new InternalServerError('Failed to assign driver');
  }

  const response: ApiSuccessResponse = {
    success: true,
    data: updatedBooking,
    message: 'Driver assigned successfully',
  };

  res.json(response);
});

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { actionType, entityType, entityId, startDate, endDate, limit } = req.query;

    const logs = await AuditService.getLogs({
      actionType: actionType as string,
      entityType: entityType as string,
      entityId: entityId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get system alerts
// @route   GET /api/admin/alerts
// @access  Private (Admin)
export const getAlerts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await DBService.getBookings();
    const users = await DBService.getAllUsers();

    const alerts: any[] = [];

    // Suspended users
    const suspendedUsers = users.filter((u: any) => u.isSuspended);
    if (suspendedUsers.length > 0) {
      alerts.push({
        type: 'suspended_users',
        severity: 'info',
        count: suspendedUsers.length,
        message: `${suspendedUsers.length} user(s) are currently suspended`,
        action: '/admin/users?status=suspended',
      });
    }

    // Stuck bookings (pending for more than 24 hours)
    const stuckBookings = bookings.filter((b: any) => {
      if (b.status !== 'pending') return false;
      const createdAt = new Date(b.createdAt);
      const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursAgo > 24;
    });
    if (stuckBookings.length > 0) {
      alerts.push({
        type: 'stuck_bookings',
        severity: 'warning',
        count: stuckBookings.length,
        message: `${stuckBookings.length} booking(s) pending for over 24 hours`,
        action: '/admin/bookings?status=pending',
      });
    }

    // Failed payments
    const failedPayments = bookings.filter((b: any) => b.paymentStatus === 'failed');
    if (failedPayments.length > 0) {
      alerts.push({
        type: 'failed_payments',
        severity: 'warning',
        count: failedPayments.length,
        message: `${failedPayments.length} booking(s) with failed payments`,
        action: '/admin/bookings?paymentStatus=failed',
      });
    }

    // Inactive drivers
    const inactiveDrivers = users.filter(
      (u: any) => u.role === 'driver' && (!u.isActive || !u.availability)
    );
    if (inactiveDrivers.length > 0) {
      alerts.push({
        type: 'inactive_drivers',
        severity: 'info',
        count: inactiveDrivers.length,
        message: `${inactiveDrivers.length} driver(s) are inactive or unavailable`,
        action: '/admin/drivers',
      });
    }

    // Pending user approvals
    const pendingApprovals = users.filter(
      (u: any) => u.approval_status === 'pending' || u.approvalStatus === 'pending'
    );
    if (pendingApprovals.length > 0) {
      alerts.push({
        type: 'pending_approvals',
        severity: 'warning',
        count: pendingApprovals.length,
        message: `${pendingApprovals.length} user(s) awaiting approval`,
        action: '/admin/approvals',
      });
    }

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const bookings = await DBService.getBookings();
    const users = await DBService.getAllUsers();

    // Filter by date range if provided
    let filteredBookings = bookings;
    if (startDate || endDate) {
      filteredBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        if (startDate && bookingDate < new Date(startDate as string)) return false;
        if (endDate && bookingDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    // User growth by role
    const userGrowth = {
      clients: users.filter((u: any) => u.role === 'client').length,
      drivers: users.filter((u: any) => u.role === 'driver').length,
      carWashes: users.filter((u: any) => u.role === 'carwash').length,
      admins: users.filter((u: any) => u.role === 'admin').length,
    };

    // Booking volume by status
    const bookingVolume = {
      pending: filteredBookings.filter((b: any) => b.status === 'pending').length,
      inProgress: filteredBookings.filter((b: any) =>
        ['accepted', 'picked_up', 'at_wash', 'washing_bay'].includes(b.status)
      ).length,
      completed: filteredBookings.filter((b: any) =>
        ['completed', 'wash_completed', 'delivered_to_client'].includes(b.status)
      ).length,
      cancelled: filteredBookings.filter((b: any) => b.status === 'cancelled').length,
    };

    // Revenue metrics
    const totalRevenue = filteredBookings
      .filter((b: any) => b.paymentStatus === 'paid')
      .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0);

    const pendingRevenue = filteredBookings
      .filter((b: any) => b.paymentStatus === 'pending')
      .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0);

    // Peak usage (bookings by hour of day)
    const bookingsByHour: Record<number, number> = {};
    filteredBookings.forEach((b: any) => {
      const hour = new Date(b.createdAt).getHours();
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
    });

    // Cancellation rate
    const cancellationRate =
      filteredBookings.length > 0
        ? (bookingVolume.cancelled / filteredBookings.length) * 100
        : 0;

    res.json({
      success: true,
      data: {
        userGrowth,
        bookingVolume,
        revenue: {
          total: totalRevenue,
          pending: pendingRevenue,
          completed: totalRevenue,
        },
        peakUsage: bookingsByHour,
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        totalBookings: filteredBookings.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get financial overview
// @route   GET /api/admin/financial
// @access  Private (Admin)
export const getFinancialOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const bookings = await DBService.getBookings();

    // Filter by date range
    let filteredBookings = bookings;
    if (startDate || endDate) {
      filteredBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        if (startDate && bookingDate < new Date(startDate as string)) return false;
        if (endDate && bookingDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    // Payment status breakdown
    const paymentStatus = {
      paid: filteredBookings.filter((b: any) => b.paymentStatus === 'paid').length,
      pending: filteredBookings.filter((b: any) => b.paymentStatus === 'pending').length,
      failed: filteredBookings.filter((b: any) => b.paymentStatus === 'failed').length,
    };

    // Revenue by status
    const revenueByStatus = {
      paid: filteredBookings
        .filter((b: any) => b.paymentStatus === 'paid')
        .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0),
      pending: filteredBookings
        .filter((b: any) => b.paymentStatus === 'pending')
        .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0),
      failed: filteredBookings
        .filter((b: any) => b.paymentStatus === 'failed')
        .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0),
    };

    // Revenue by car wash
    const revenueByCarWash: Record<string, any> = {};
    filteredBookings
      .filter((b: any) => b.paymentStatus === 'paid')
      .forEach((b: any) => {
        const carWashId = b.carWashId?.id || b.carWashId || 'unknown';
        const carWashName = b.carWashId?.carWashName || b.carWashId?.name || 'Unknown';
        if (!revenueByCarWash[carWashId]) {
          revenueByCarWash[carWashId] = {
            carWashId,
            carWashName,
            revenue: 0,
            bookingCount: 0,
          };
        }
        revenueByCarWash[carWashId].revenue += parseFloat(b.totalAmount || 0);
        revenueByCarWash[carWashId].bookingCount += 1;
      });

    res.json({
      success: true,
      data: {
        paymentStatus,
        revenueByStatus,
        revenueByCarWash: Object.values(revenueByCarWash),
        totalRevenue: revenueByStatus.paid,
        pendingRevenue: revenueByStatus.pending,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all feature flags
// @route   GET /api/admin/feature-flags
// @access  Private (Admin)
export const getFeatureFlags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flags = await FeatureFlagService.getAllFlags();
    res.json({
      success: true,
      data: flags,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single feature flag
// @route   GET /api/admin/feature-flags/:id
// @access  Private (Admin)
export const getFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flag = await FeatureFlagService.getFlagById(req.params.id);
    if (!flag) {
      res.status(404).json({ success: false, message: 'Feature flag not found' });
      return;
    }
    res.json({
      success: true,
      data: flag,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create feature flag
// @route   POST /api/admin/feature-flags
// @access  Private (Admin - Super Admin only)
export const createFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only super_admin can create feature flags
    if (req.user!.adminLevel !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Only super admins can create feature flags',
      });
      return;
    }

    const flag = await FeatureFlagService.createFlag(req.body, req.user!.id);

    // Log the creation
    await AuditService.log(
      req.user!.id,
      'feature_flag_created',
      'feature_flag',
      `Created feature flag: ${flag.name}`,
      {
        entityId: flag.id,
        newValue: flag,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: flag,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update feature flag
// @route   PUT /api/admin/feature-flags/:id
// @access  Private (Admin)
export const updateFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existingFlag = await FeatureFlagService.getFlagById(req.params.id);
    if (!existingFlag) {
      res.status(404).json({ success: false, message: 'Feature flag not found' });
      return;
    }

    const updatedFlag = await FeatureFlagService.updateFlag(
      req.params.id,
      req.body,
      req.user!.id
    );

    // Log the update
    await AuditService.log(
      req.user!.id,
      'feature_flag_updated',
      'feature_flag',
      `Updated feature flag: ${updatedFlag.name} (${existingFlag.status} → ${updatedFlag.status})`,
      {
        entityId: updatedFlag.id,
        oldValue: existingFlag,
        newValue: updatedFlag,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: updatedFlag,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete feature flag
// @route   DELETE /api/admin/feature-flags/:id
// @access  Private (Admin - Super Admin only)
export const deleteFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only super_admin can delete feature flags
    if (req.user!.adminLevel !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Only super admins can delete feature flags',
      });
      return;
    }

    const existingFlag = await FeatureFlagService.getFlagById(req.params.id);
    if (!existingFlag) {
      res.status(404).json({ success: false, message: 'Feature flag not found' });
      return;
    }

    await FeatureFlagService.deleteFlag(req.params.id);

    // Log the deletion
    await AuditService.log(
      req.user!.id,
      'feature_flag_deleted',
      'feature_flag',
      `Deleted feature flag: ${existingFlag.name}`,
      {
        entityId: existingFlag.id,
        oldValue: existingFlag,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      message: 'Feature flag deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Check if feature is enabled (for frontend/API use)
// @route   GET /api/admin/feature-flags/check/:name
// @access  Private
export const checkFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    const isEnabled = await FeatureFlagService.isFeatureEnabled(name, userRole, userId);

    res.json({
      success: true,
      data: {
        name,
        enabled: isEnabled,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await DBService.getBookingStats(
      startDate as string,
      endDate as string
    );

    // Group by status
    const statusBreakdown: any = {};
    stats.forEach((booking: any) => {
      if (!statusBreakdown[booking.status]) {
        statusBreakdown[booking.status] = { count: 0, totalRevenue: 0 };
      }
      statusBreakdown[booking.status].count++;
      if (booking.paymentStatus === 'paid') {
        statusBreakdown[booking.status].totalRevenue += parseFloat(booking.totalAmount || 0);
      }
    });

    // Get revenue by car wash
    const bookings = await DBService.getBookings();
    const revenueByCarWash: any = {};
    bookings
      .filter((b: any) => b.paymentStatus === 'paid')
      .forEach((booking: any) => {
        const carWashId = booking.carWashId;
        if (!revenueByCarWash[carWashId]) {
          revenueByCarWash[carWashId] = {
            carWashId,
            totalRevenue: 0,
            bookingCount: 0,
          };
        }
        revenueByCarWash[carWashId].totalRevenue += parseFloat(booking.totalAmount || 0);
        revenueByCarWash[carWashId].bookingCount++;
      });

    res.json({
      success: true,
      data: {
        statusBreakdown: Object.entries(statusBreakdown).map(([status, data]: [string, any]) => ({
          _id: status,
          ...data,
        })),
        revenueByCarWash: Object.values(revenueByCarWash),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get data retention policies
// @route   GET /api/admin/compliance/retention-policies
// @access  Private (Admin)
export const getRetentionPolicies = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policies = await ComplianceService.getRetentionPolicies();
    res.json({
      success: true,
      data: policies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update data retention policy
// @route   PUT /api/admin/compliance/retention-policies/:id
// @access  Private (Admin - Super Admin only)
export const updateRetentionPolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.adminLevel !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Only super admins can update retention policies',
      });
      return;
    }

    const policy = await ComplianceService.updateRetentionPolicy(req.params.id, req.body);
    res.json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get user data summary
// @route   GET /api/admin/compliance/user-data/:userId
// @access  Private (Admin)
export const getUserDataSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const summary = await ComplianceService.getUserDataSummary(req.params.userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Anonymize user data
// @route   POST /api/admin/compliance/anonymize/:userId
// @access  Private (Admin - Super Admin only)
export const anonymizeUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.adminLevel !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Only super admins can anonymize user data',
      });
      return;
    }

    const result = await ComplianceService.anonymizeUserData(
      req.params.userId,
      req.user!.id,
      req.body.reason || 'Admin request',
      req.body.fields || ['email', 'name', 'phone', 'nrc']
    );

    await AuditService.log(
      req.user!.id,
      'user_data_anonymized',
      'user',
      `Anonymized data for user ${req.params.userId}`,
      {
        entityId: req.params.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all incidents
// @route   GET /api/admin/incidents
// @access  Private (Admin)
export const getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, severity } = req.query;
    const incidents = await IncidentService.getIncidents({
      status: status as any,
      type: type as any,
      severity: severity as any,
    });
    res.json({
      success: true,
      data: incidents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single incident
// @route   GET /api/admin/incidents/:id
// @access  Private (Admin)
export const getIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await IncidentService.getIncidentById(req.params.id);
    res.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create incident
// @route   POST /api/admin/incidents
// @access  Private (Admin)
export const createIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incident = await IncidentService.createIncident(req.body, req.user!.id);

    await AuditService.log(
      req.user!.id,
      'incident_created',
      'incident',
      `Created incident: ${incident.title}`,
      {
        entityId: incident.id,
        newValue: incident,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update incident
// @route   PUT /api/admin/incidents/:id
// @access  Private (Admin)
export const updateIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existingIncident = await IncidentService.getIncidentById(req.params.id);
    if (!existingIncident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    const incident = await IncidentService.updateIncident(req.params.id, req.body);

    await AuditService.log(
      req.user!.id,
      'incident_updated',
      'incident',
      `Updated incident: ${incident.title}`,
      {
        entityId: incident.id,
        oldValue: existingIncident,
        newValue: incident,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Add incident update
// @route   POST /api/admin/incidents/:id/updates
// @access  Private (Admin)
export const addIncidentUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { comment, statusChange } = req.body;
    const update = await IncidentService.addIncidentUpdate(
      req.params.id,
      req.user!.id,
      comment,
      statusChange
    );

    // Update incident status if statusChange provided
    if (statusChange) {
      await IncidentService.updateIncident(req.params.id, { status: statusChange });
    }

    res.json({
      success: true,
      data: update,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Assign incident
// @route   POST /api/admin/incidents/:id/assign
// @access  Private (Admin)
export const assignIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignedTo } = req.body;
    const incident = await IncidentService.updateIncident(req.params.id, {
      assignedTo,
      status: 'assigned',
    });

    await AuditService.log(
      req.user!.id,
      'incident_assigned',
      'incident',
      `Assigned incident: ${incident.title} to user ${assignedTo}`,
      {
        entityId: incident.id,
        newValue: { assignedTo },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Resolve incident
// @route   POST /api/admin/incidents/:id/resolve
// @access  Private (Admin)
export const resolveIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resolutionNotes } = req.body;
    const incident = await IncidentService.resolveIncident(
      req.params.id,
      req.user!.id,
      resolutionNotes
    );

    await AuditService.log(
      req.user!.id,
      'incident_resolved',
      'incident',
      `Resolved incident: ${incident.title}`,
      {
        entityId: incident.id,
        newValue: { resolutionNotes },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Escalate incident
// @route   POST /api/admin/incidents/:id/escalate
// @access  Private (Admin)
export const escalateIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existingIncident = await IncidentService.getIncidentById(req.params.id);
    if (!existingIncident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    // Find super admin
    const allUsers = await DBService.getAllUsers();
    const superAdmin = allUsers.find(
      (u: any) => u.role === 'admin' && u.adminLevel === 'super_admin'
    );

    if (!superAdmin) {
      res.status(404).json({
        success: false,
        message: 'No super admin found to escalate to',
      });
      return;
    }

    // Update incident to critical and assign to super admin
    const escalatedIncident = await IncidentService.updateIncident(req.params.id, {
      severity: 'critical',
      assignedTo: superAdmin.id,
      status: 'assigned',
    });

    // Add escalation update
    await IncidentService.addIncidentUpdate(
      req.params.id,
      req.user!.id,
      `Incident escalated to super admin (${superAdmin.name}) by ${req.user!.name}`,
      'assigned'
    );

    await AuditService.log(
      req.user!.id,
      'incident_escalated',
      'incident',
      `Escalated incident: ${escalatedIncident.title} to super admin`,
      {
        entityId: escalatedIncident.id,
        oldValue: existingIncident,
        newValue: escalatedIncident,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );

    res.json({
      success: true,
      data: escalatedIncident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
