# Incident Resolution & Escalation

## Overview

The SuCAR admin dashboard now includes comprehensive incident resolution and escalation workflows, allowing admins to efficiently manage, track, and resolve system incidents.

## Features

### 1. Incident Detail View

**Full Workflow Interface:**
- Complete incident information
- Status and severity badges
- Assignment section
- Updates and comments timeline
- Resolution notes
- Related entity information

**Quick Actions:**
- Assign to admin
- Add updates/comments
- Change status
- Resolve incident
- Escalate to super admin

### 2. Assignment System

**Features:**
- Assign incidents to specific admins
- "Assign to Me" quick action
- View assigned admin information
- Track assignment history

**Workflow:**
1. Open incident detail
2. Select admin from dropdown
3. Confirm assignment
4. Incident status changes to "assigned"

### 3. Escalation System

**Escalation Rules:**
- Any admin can escalate incidents
- Escalation sets severity to "critical"
- Automatically assigns to super admin
- Creates escalation update in timeline
- Full audit logging

**When to Escalate:**
- High-severity incidents requiring super admin attention
- Unresolved incidents after reasonable time
- Issues affecting multiple users
- Critical system failures

### 4. Status Workflow

**Status Transitions:**
- Open → Assigned → In Progress → Resolved → Closed
- Status changes tracked in updates
- Can change status via comments
- Resolution requires notes

### 5. Updates & Comments

**Features:**
- Add comments to incidents
- Change status with comments
- View complete timeline
- See who made each update
- Timestamp for all updates

### 6. Quick Actions

**From Incident List:**
- "Assign to Me" - Quick self-assignment
- "Resolve" - Quick resolution (requires notes)
- Click card to view full details

**From Incident Detail:**
- Assign to specific admin
- Add update with status change
- Escalate to super admin
- Resolve with notes

### 7. Auto-Incident Creation

**From Alerts:**
- Click on critical alerts (stuck bookings, failed payments)
- Option to create incident automatically
- Pre-filled with alert information
- Navigate directly to new incident

### 8. Critical Metrics Highlighting

**Dashboard Stats:**
- Visual indicators for high values
- "⚠️ High" badge for pending pickups > 10
- "✓ Good" badge for revenue > 100K
- Subtle, non-intrusive indicators

## API Endpoints

### Incident Management
- `GET /api/admin/incidents` - Get all incidents (filterable)
- `GET /api/admin/incidents/:id` - Get incident with updates
- `POST /api/admin/incidents` - Create incident
- `PUT /api/admin/incidents/:id` - Update incident
- `POST /api/admin/incidents/:id/updates` - Add comment/update
- `POST /api/admin/incidents/:id/assign` - Assign incident
- `POST /api/admin/incidents/:id/resolve` - Resolve incident
- `POST /api/admin/incidents/:id/escalate` - Escalate incident

## Usage

### Creating an Incident

1. Navigate to Admin Dashboard → Incidents
2. Click "+ Create Incident"
3. Fill in:
   - Title
   - Description
   - Type
   - Severity
4. Save

### Assigning an Incident

**From List:**
1. Click "Assign to Me" on unassigned incident

**From Detail:**
1. Open incident detail
2. Select admin from dropdown
3. Click "Assign"
4. Confirm

### Escalating an Incident

1. Open incident detail
2. Click "⚠️ Escalate" button
3. Confirm escalation
4. Incident automatically assigned to super admin
5. Severity set to "critical"

### Resolving an Incident

1. Open incident detail
2. Click "✓ Resolve" button
3. Enter resolution notes
4. Incident marked as resolved
5. Resolution timestamp recorded

### Adding Updates

1. Open incident detail
2. Scroll to "Updates & Comments"
3. Enter comment
4. Optionally change status
5. Click "Add Update"

## Visual Indicators

### Incident Cards
- **Critical Severity**: Red badge with pulsing animation
- **High Severity**: Orange badge
- **Medium Severity**: Amber badge
- **Low Severity**: Blue badge

### Status Badges
- **Open**: Red
- **Assigned**: Blue
- **In Progress**: Amber
- **Resolved**: Green
- **Closed**: Gray

### Dashboard Stats
- **High Alert**: ⚠️ badge for values above threshold
- **Good Status**: ✓ badge for positive metrics

## Audit Integration

All incident actions are logged:
- `incident_created` - New incidents
- `incident_updated` - Status/field changes
- `incident_assigned` - Assignment actions
- `incident_resolved` - Resolution
- `incident_escalated` - Escalation to super admin

View in Admin Dashboard → Audit Logs

## Best Practices

1. **Quick Response**: Assign incidents promptly
2. **Clear Updates**: Add meaningful comments
3. **Escalate Early**: Don't wait on critical issues
4. **Document Resolution**: Always add resolution notes
5. **Track Progress**: Update status as you work
6. **Review Regularly**: Check open incidents daily

## Incident Types

- **Failed Booking**: Booking creation or processing failures
- **Failed Transaction**: Payment processing issues
- **Suspicious Activity**: Unusual user behavior
- **Technical Alert**: System errors or performance issues
- **Operational Alert**: Business process issues
- **Other**: Miscellaneous incidents

## Severity Levels

- **Critical**: Immediate attention required, escalate to super admin
- **High**: Urgent, assign and work on promptly
- **Medium**: Important, address within reasonable time
- **Low**: Minor issues, can be handled as capacity allows

## Future Enhancements

- Incident templates
- Automated incident creation from system events
- SLA tracking and alerts
- Incident analytics and trends
- Email notifications for assignments
- Bulk incident operations
- Incident categories and tags
