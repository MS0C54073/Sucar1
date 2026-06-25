import express from 'express';
import {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  getAllBookings,
  assignDriver,
  getReports,
  getAuditLogs,
  getSystemLogs,
  getAlerts,
  getAnalytics,
  getFinancialOverview,
  getFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  checkFeatureFlag,
  getRetentionPolicies,
  updateRetentionPolicy,
  getUserDataSummary,
  anonymizeUserData,
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  addIncidentUpdate,
  assignIncident,
  resolveIncident,
  escalateIncident,
} from '../controllers/adminController';
import {
  createUser,
  getPendingUserApprovals,
  approvePendingUser,
  rejectPendingUser,
  getUserApprovalHistoryController,
} from '../controllers/userApprovalController';
import { protect, authorize } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'subadmin'));

router.get('/dashboard', getDashboard);
// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/suspend', requirePermission('admin'), suspendUser);
router.post('/users/:id/reactivate', requirePermission('admin'), reactivateUser);
router.delete('/users/:id', requirePermission('admin'), deleteUser);

// User approval workflow
router.post('/users/create', createUser);
router.get('/users/approvals/pending', getPendingUserApprovals);
router.post('/users/:userId/approve', approvePendingUser);
router.post('/users/:userId/reject', rejectPendingUser);
router.get('/users/:userId/approval-history', getUserApprovalHistoryController);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/assign-driver', express.json(), assignDriver);
router.get('/reports', getReports);
router.get('/audit-logs', getAuditLogs);
router.get('/logs', getSystemLogs);
router.get('/alerts', getAlerts);
router.get('/analytics', getAnalytics);
router.get('/financial', getFinancialOverview);
router.get('/feature-flags', getFeatureFlags);
router.get('/feature-flags/check/:name', checkFeatureFlag);
router.get('/feature-flags/:id', getFeatureFlag);
router.post('/feature-flags', createFeatureFlag);
router.put('/feature-flags/:id', updateFeatureFlag);
router.delete('/feature-flags/:id', deleteFeatureFlag);
router.get('/compliance/retention-policies', getRetentionPolicies);
router.put('/compliance/retention-policies/:id', updateRetentionPolicy);
router.get('/compliance/user-data/:userId', getUserDataSummary);
router.post('/compliance/anonymize/:userId', anonymizeUserData);
router.get('/incidents', getIncidents);
router.get('/incidents/:id', getIncident);
router.post('/incidents', createIncident);
router.put('/incidents/:id', updateIncident);
router.post('/incidents/:id/updates', addIncidentUpdate);
router.post('/incidents/:id/assign', assignIncident);
router.post('/incidents/:id/resolve', resolveIncident);
router.post('/incidents/:id/escalate', escalateIncident);

export default router;
