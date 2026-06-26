# User Management and Approval Workflow

## Overview

The SuCAR system now includes a comprehensive user management and approval workflow that allows:

- **Admins** (Super Admin and Admin level) can create users that are automatically approved
- **Sub-Admins** (Support level) can create users, but they require Admin approval before accessing the system
- **Admins** receive notifications and can review, approve, or reject pending user requests
- Full audit trail and status tracking for all user creation and approval actions

## Features

### 1. User Creation with Approval Workflow

- **Admin Users**: Can create users of any type (Client, Driver, Car Wash, Admin) with automatic approval
- **Sub-Admin Users**: Can create users, but their creations require Admin approval
- Role-specific fields are captured during creation (license info for drivers, car wash details, etc.)

### 2. Pending Approvals Dashboard

- Dedicated page (`/admin/approvals`) showing all pending user approvals
- Displays user details, role, creator information, and request timestamp
- Quick approve/reject actions with optional notes/reasons
- Real-time updates via polling (30-second intervals)

### 3. User Management Enhancements

- Approval status badges in user list (Pending, Approved, Rejected)
- Filter by approval status
- Visual indicators for users awaiting approval
- Integration with existing user management features

### 4. Alerts & Notifications

- Pending approvals appear in admin alerts panel
- Clickable alerts that navigate to approvals page
- Real-time badge count in navigation menu

### 5. Audit Trail

- All user creation, approval, and rejection actions are logged
- Includes creator information, approver details, timestamps, and notes
- Full audit history accessible via audit logs

## Database Schema

The following fields were added to the `users` table:

- `approval_status` (pending, approved, rejected)
- `created_by` (UUID reference to creator)
- `approved_by` (UUID reference to approver)
- `approval_notes` (text)
- `approval_requested_at` (timestamp)
- `approved_at` (timestamp)
- `rejected_at` (timestamp)
- `rejection_reason` (text)

## API Endpoints

### User Creation
- `POST /api/admin/users/create` - Create a new user (with approval workflow)

### Approval Management
- `GET /api/admin/users/approvals/pending` - Get all pending approvals
- `POST /api/admin/users/:userId/approve` - Approve a pending user
- `POST /api/admin/users/:userId/reject` - Reject a pending user
- `GET /api/admin/users/:userId/approval-history` - Get approval history for a user

## Setup Instructions

### 1. Run Database Migration

Execute the migration script in Supabase SQL Editor:

```sql
-- Run: backend/migrations/add-user-approval-fields.sql
```

This adds all necessary fields to the `users` table and sets existing users to 'approved' status.

### 2. Backend Setup

The backend services and controllers are already integrated:
- `backend/src/services/userApprovalService.ts` - Approval workflow logic
- `backend/src/controllers/userApprovalController.ts` - API controllers
- Routes added to `backend/src/routes/adminRoutes.ts`

### 3. Frontend Setup

All frontend components are integrated:
- `frontend/src/components/admin/CreateUserModal.tsx` - User creation form
- `frontend/src/components/admin/PendingApprovals.tsx` - Approvals dashboard
- `frontend/src/components/admin/UserManagement.tsx` - Updated with approval status
- Route added to `frontend/src/pages/AdminDashboard.tsx`

## Usage

### Creating a User (Admin)

1. Navigate to **Users** → Click **+ Add User**
2. Fill in user details and role-specific information
3. User is created and automatically approved (can access system immediately)

### Creating a User (Sub-Admin)

1. Navigate to **Users** → Click **+ Add User**
2. Fill in user details
3. Notice the "Approval Required" banner
4. User is created but marked as "pending"
5. Admin receives notification in alerts panel

### Approving/Rejecting Users (Admin Only)

1. Navigate to **Pending Approvals** (or click alert notification)
2. Review user details and creator information
3. Click **Approve** or **Reject**
4. Add optional notes (for approval) or required reason (for rejection)
5. User status is updated and notifications are sent

## Security & Permissions

- Only **Admin** and **Super Admin** can approve/reject users
- **Sub-Admins** can create users but cannot approve them
- All actions are logged in audit trail
- Approval status is checked before allowing system access

## Status Flow

```
User Creation
    ↓
[Admin] → Approved → Active → Can Access System
    ↓
[Sub-Admin] → Pending → Awaiting Approval
    ↓
[Admin Review] → Approved → Active → Can Access System
              → Rejected → Inactive → Cannot Access System
```

## UI/UX Features

- Clean, modern interface consistent with Admin Dashboard
- Visual status indicators (badges, colors)
- Responsive design for desktop and tablet
- Real-time updates and notifications
- Clear workflow and intuitive actions
- Comprehensive error handling and validation

## Testing

1. **Test Admin Creation**: Create a user as Admin - should be auto-approved
2. **Test Sub-Admin Creation**: Create a user as Sub-Admin - should require approval
3. **Test Approval**: Approve a pending user - should become active
4. **Test Rejection**: Reject a pending user - should be marked as rejected
5. **Test Alerts**: Verify pending approvals appear in alerts panel
6. **Test Filters**: Filter users by approval status in user management

## Notes

- Existing users are automatically set to 'approved' status
- Rejected users cannot access the system but their data is retained
- Approval history is preserved for audit purposes
- All timestamps are stored in UTC
