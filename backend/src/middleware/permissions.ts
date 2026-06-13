import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Permission levels:
 * - super_admin: Full access, can manage all admins
 * - admin: Can manage users, bookings, drivers, car washes (but not other admins)
 * - support: Read-only access, can view but not modify
 */

export type AdminLevel = 'super_admin' | 'admin' | 'support';

export const requirePermission = (requiredLevel: AdminLevel) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    // Check admin level
    const userLevel: AdminLevel = (req.user.adminLevel as AdminLevel) || 'admin';
    const levelHierarchy: Record<AdminLevel, number> = {
      super_admin: 3,
      admin: 2,
      support: 1,
    };

    // Ensure userLevel is valid
    if (!levelHierarchy[userLevel]) {
      res.status(403).json({
        success: false,
        message: 'Invalid admin level',
      });
      return;
    }

    if (levelHierarchy[userLevel] < levelHierarchy[requiredLevel]) {
      res.status(403).json({
        success: false,
        message: `Requires ${requiredLevel} access level`,
      });
      return;
    }

    next();
  };
};

/**
 * Check if user can modify another user
 * - super_admin: Can modify anyone
 * - admin: Can modify non-admin users
 * - support: Cannot modify anyone
 */
export const canModifyUser = (currentUser: any, targetUser: any): boolean => {
  if (currentUser.role !== 'admin') return false;

  const currentLevel = currentUser.adminLevel || 'admin';
  const targetLevel = targetUser.adminLevel || (targetUser.role === 'admin' ? 'admin' : null);

  // Super admin can modify anyone
  if (currentLevel === 'super_admin') return true;

  // Admin can only modify non-admin users
  if (currentLevel === 'admin' && !targetLevel) return true;

  // Support cannot modify anyone
  return false;
};

/**
 * Check if user can change roles
 * - super_admin: Can change any role
 * - admin: Cannot change roles to/from admin
 * - support: Cannot change roles
 */
export const canChangeRole = (currentUser: any, newRole: string): boolean => {
  if (currentUser.role !== 'admin') return false;

  const currentLevel = currentUser.adminLevel || 'admin';

  // Super admin can change any role
  if (currentLevel === 'super_admin') return true;

  // Admin cannot change roles to/from admin
  if (newRole === 'admin' || currentLevel === 'support') return false;

  return true;
};
