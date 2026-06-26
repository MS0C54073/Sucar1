# Admin Role Management & Permissions

## Overview

The SuCAR admin dashboard now includes comprehensive role management and permission controls, extending the existing system without breaking functionality.

## Database Migration

**IMPORTANT:** Run this SQL migration in Supabase SQL Editor before using the new features:

```sql
-- Add admin_level column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_level VARCHAR(20) DEFAULT NULL 
CHECK (admin_level IN ('super_admin', 'admin', 'support') OR admin_level IS NULL);

-- Add suspension fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id);

-- Set existing admins to 'admin' level
UPDATE users 
SET admin_level = 'admin' 
WHERE role = 'admin' AND admin_level IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_admin_level ON users(admin_level);
CREATE INDEX IF NOT EXISTS idx_users_suspension ON users(is_suspended);
```

## Admin Role Levels

### 1. Super Admin (`super_admin`)
- **Full Access**: Can manage all users including other admins
- **Permissions**:
  - Change any user's role
  - Modify admin levels
  - Suspend/activate any user
  - Delete any user
  - Full system control

### 2. Admin (`admin`)
- **Standard Access**: Can manage non-admin users
- **Permissions**:
  - Manage clients, drivers, car wash providers
  - Suspend/activate non-admin users
  - Cannot modify other admins
  - Cannot change roles to/from admin

### 3. Support (`support`)
- **Read-Only Access**: View-only access
- **Permissions**:
  - View all data
  - Cannot modify users
  - Cannot change roles
  - Cannot suspend/activate users

## User Management Features

### Suspension System
- **Suspend User**: Temporarily block access with reason
- **Reactivate User**: Restore access and clear suspension
- **Suspension Tracking**: Records who suspended, when, and why

### Status Indicators
- **Active**: User can access the system
- **Inactive**: User account is deactivated
- **Suspended**: User is temporarily blocked (with reason)

### Role Management
- **Change User Role**: Convert between client, driver, carwash, admin
- **Admin Level Assignment**: Set admin level (super_admin, admin, support)
- **Permission Checks**: Only authorized admins can change roles

## API Endpoints

### User Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get single user
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/suspend` - Suspend user (with reason)
- `POST /api/admin/users/:id/reactivate` - Reactivate user
- `DELETE /api/admin/users/:id` - Soft delete user

### Permission Middleware
- `requirePermission(level)` - Check admin level
- `canModifyUser(currentUser, targetUser)` - Check modification permission
- `canChangeRole(currentUser, newRole)` - Check role change permission

## Frontend Features

### User Management Table
- **Admin Level Column**: Shows admin level for admin users
- **Status Badges**: Visual indicators for active/inactive/suspended
- **Suspension Reason**: Tooltip shows why user was suspended
- **Action Buttons**:
  - ⏸️ Suspend (with reason input)
  - ▶️ Reactivate
  - 🚫 Deactivate / ✅ Activate
  - 👑 Make Admin
  - ⭐ Make Super Admin (for admins)
  - 🗑️ Delete

### Filters
- **Role Filter**: Filter by client, driver, carwash, admin
- **Status Filter**: Filter by active, suspended, inactive
- **Search**: Search by name, email, phone

### Modals
- **User Edit Modal**: Edit user details including admin level
- **Confirm Dialogs**: All destructive actions require confirmation
- **Suspension Dialog**: Includes reason input field

## Safety Features

1. **Confirmation Dialogs**: All destructive actions require confirmation
2. **Permission Checks**: Backend validates all permission changes
3. **Audit Trail**: Suspension records who, when, and why
4. **Visual Feedback**: Clear status indicators and badges
5. **Reversible Actions**: Suspension can be reversed

## Usage Examples

### Making a User Super Admin
1. Go to User Management
2. Find the admin user
3. Click ⭐ button
4. Confirm the change

### Suspending a User
1. Go to User Management
2. Find the user
3. Click ⏸️ Suspend button
4. Enter reason for suspension
5. Confirm

### Reactivating a Suspended User
1. Go to User Management
2. Find suspended user (filter by "Suspended")
3. Click ▶️ Reactivate button
4. Confirm

## Permission Matrix

| Action | Super Admin | Admin | Support |
|--------|-------------|-------|---------|
| View Users | ✅ | ✅ | ✅ |
| Edit Non-Admin Users | ✅ | ✅ | ❌ |
| Edit Admin Users | ✅ | ❌ | ❌ |
| Suspend Users | ✅ | ✅ (non-admin) | ❌ |
| Change Roles | ✅ | ✅ (non-admin) | ❌ |
| Change Admin Levels | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ✅ (non-admin) | ❌ |

## Notes

- All existing functionality remains intact
- Permission checks are enforced on both frontend and backend
- Suspension reasons are stored and displayed
- Admin levels default to 'admin' for existing admin users
- Support level is read-only and cannot modify data
