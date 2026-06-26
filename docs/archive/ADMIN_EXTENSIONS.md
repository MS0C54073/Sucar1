# Admin Dashboard Extensions

## Overview

The SuCAR Admin Dashboard has been extended with comprehensive administrative capabilities including activity logging, monitoring, analytics, financial oversight, and system configuration.

## New Features

### 1. Activity & Audit Logging

**Backend:**
- `AuditService` - Service for creating and retrieving audit logs
- Automatic logging of all admin actions (user updates, suspensions, role changes)
- Audit log table with full history

**Frontend:**
- `AuditLogs` component - View all system activity
- Filterable by action type, entity type, and date range
- Read-only, tamper-resistant display

**Migration Required:**
Run `backend/migrations/add-audit-log.sql` in Supabase SQL Editor.

### 2. Monitoring & Alerts

**Backend:**
- `getAlerts` endpoint - Detects system issues
- Monitors:
  - Suspended users
  - Stuck bookings (>24 hours pending)
  - Failed payments
  - Inactive drivers

**Frontend:**
- `AlertsPanel` component - Displays system alerts on dashboard
- Auto-refreshes every 30 seconds
- Clickable alerts that navigate to relevant sections
- Visual severity indicators (info, warning, error)

### 3. Analytics & Insights

**Backend:**
- `getAnalytics` endpoint - Comprehensive analytics data
- Metrics:
  - User growth by role
  - Booking volume by status
  - Revenue metrics
  - Peak usage by hour
  - Cancellation rates

**Frontend:**
- `Analytics` component - Visual analytics dashboard
- Date range filtering
- Metric cards and peak usage charts
- Clear, readable visualizations

### 4. Financial Overview

**Backend:**
- `getFinancialOverview` endpoint - Financial data aggregation
- Tracks:
  - Payment status breakdown
  - Revenue by status (paid, pending, failed)
  - Revenue by car wash provider
  - Total and pending revenue

**Frontend:**
- `FinancialOverview` component - Financial dashboard
- Date range filtering
- Revenue cards and tables
- Currency formatting

### 5. System Configuration

**Frontend:**
- `SystemConfig` component - Platform settings management
- Sections:
  - Booking Rules (advance booking limits, cancellation windows)
  - Platform Fees (commission rates, service fees)
  - Service Availability (operating hours, weekend bookings)
- Edit mode with confirmation dialogs
- Clear labels and helper text

## API Endpoints

### New Endpoints

- `GET /api/admin/audit-logs` - Get audit logs (filterable)
- `GET /api/admin/alerts` - Get system alerts
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/financial` - Get financial overview

### Existing Endpoints (Enhanced)

- All user management endpoints now log to audit trail
- Suspension/reactivation actions are logged with reasons

## Database Migrations

### Required Migrations

1. **Audit Log Table** (`backend/migrations/add-audit-log.sql`)
   - Creates `audit_logs` table
   - Adds indexes for performance
   - Stores all admin actions with timestamps

2. **Admin Levels** (from previous extension)
   - `admin_level` column in `users` table
   - Suspension fields (`is_suspended`, `suspension_reason`, etc.)

## Navigation Updates

New menu items added to admin sidebar:
- Analytics
- Financial
- Audit Logs
- Settings (System Config)

## Usage

### Viewing Audit Logs

1. Navigate to Admin Dashboard → Audit Logs
2. Filter by action type, entity, or date range
3. View complete history of all admin actions

### Monitoring System Health

1. Alerts appear automatically on dashboard home
2. Click any alert to navigate to relevant section
3. Alerts auto-refresh every 30 seconds

### Viewing Analytics

1. Navigate to Admin Dashboard → Analytics
2. Select date range
3. View user growth, booking trends, and revenue metrics

### Financial Overview

1. Navigate to Admin Dashboard → Financial
2. Select date range
3. View payment status, revenue breakdown, and provider performance

### System Configuration

1. Navigate to Admin Dashboard → Settings
2. Click "Edit" on any section
3. Make changes and confirm
4. Changes require confirmation before saving

## Safety Features

- All configuration changes require confirmation
- Audit trail is read-only from UI
- Financial data is read-only (no modifications)
- Alerts are informational only (no auto-actions)
- All actions logged with admin ID and timestamp

## Performance Considerations

- Audit logs limited to 1000 entries by default
- Analytics queries filtered by date range
- Alerts refresh every 30 seconds (configurable)
- All queries use database indexes

## Future Enhancements

- Export audit logs to CSV/PDF
- Scheduled reports
- Advanced analytics charts
- Payout management interface
- Real-time notifications for critical alerts
