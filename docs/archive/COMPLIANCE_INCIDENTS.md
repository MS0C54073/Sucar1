# Compliance & Incident Management

## Overview

The SuCAR admin dashboard now includes comprehensive compliance and data governance features, as well as incident management capabilities for operational control.

## Compliance & Data Governance

### Features

1. **Data Retention Policies**
   - Configure retention periods for different entity types
   - Auto-delete settings
   - Policy management (Super Admin only)

2. **User Data Review**
   - View all data associated with a user
   - Data counts (bookings, vehicles, etc.)
   - Consent records
   - Anonymization history

3. **Data Anonymization**
   - Anonymize user personal data (email, name, phone, NRC)
   - Requires reason and field selection
   - Full audit trail
   - Super Admin only

4. **User Consent Tracking**
   - Track user consent for data processing
   - Marketing consent
   - Analytics consent
   - GDPR compliance

### API Endpoints

- `GET /api/admin/compliance/retention-policies` - Get all retention policies
- `PUT /api/admin/compliance/retention-policies/:id` - Update policy (Super Admin)
- `GET /api/admin/compliance/user-data/:userId` - Get user data summary
- `POST /api/admin/compliance/anonymize/:userId` - Anonymize user data (Super Admin)

## Incident Management

### Features

1. **Incident Creation**
   - Create incidents for various types
   - Set severity levels
   - Add descriptions and context

2. **Incident Tracking**
   - Filter by status, type, severity
   - Assign incidents to admins
   - Add comments/updates
   - Track resolution

3. **Incident Types**
   - Failed Booking
   - Failed Transaction
   - Suspicious Activity
   - Technical Alert
   - Operational Alert
   - Other

4. **Severity Levels**
   - Low
   - Medium
   - High
   - Critical

5. **Status Workflow**
   - Open → Assigned → In Progress → Resolved → Closed

### API Endpoints

- `GET /api/admin/incidents` - Get all incidents (filterable)
- `GET /api/admin/incidents/:id` - Get single incident with updates
- `POST /api/admin/incidents` - Create incident
- `PUT /api/admin/incidents/:id` - Update incident
- `POST /api/admin/incidents/:id/updates` - Add comment/update
- `POST /api/admin/incidents/:id/assign` - Assign incident
- `POST /api/admin/incidents/:id/resolve` - Resolve incident

## Database Migration

**IMPORTANT:** Run this SQL migration in Supabase SQL Editor:

```sql
-- See backend/migrations/add-compliance-incidents.sql
```

The migration creates:
- `data_retention_policies` table
- `user_consents` table
- `data_anonymizations` table
- `incidents` table
- `incident_updates` table
- Indexes and triggers
- Default retention policies

## Usage

### Managing Data Retention

1. Navigate to Admin Dashboard → Compliance
2. View current retention policies
3. Policies show retention days and auto-delete settings
4. Super Admins can update policies

### Reviewing User Data

1. Navigate to Admin Dashboard → Compliance
2. Switch to "User Data Review" tab
3. Enter user ID or email
4. View all associated data
5. Check anonymization history

### Anonymizing User Data

1. Review user data first
2. Click "Anonymize Personal Data"
3. Confirm the action
4. Data is anonymized and logged
5. Cannot be undone

### Creating Incidents

1. Navigate to Admin Dashboard → Incidents
2. Click "+ Create Incident"
3. Fill in:
   - Title
   - Description
   - Type
   - Severity
4. Save

### Managing Incidents

1. Filter incidents by status, type, severity
2. Click incident to view details
3. Assign to admin
4. Add comments/updates
5. Resolve when fixed
6. Close when complete

## Audit Integration

All compliance and incident actions are logged:
- `retention_policy_updated` - Policy changes
- `user_data_anonymized` - Data anonymization
- `incident_created` - New incidents
- `incident_updated` - Incident changes
- `incident_assigned` - Assignment
- `incident_resolved` - Resolution

View in Admin Dashboard → Audit Logs

## Safety Features

- **Confirmation Required**: All data anonymization requires confirmation
- **Super Admin Only**: Sensitive operations restricted
- **Audit Trail**: Complete history of all actions
- **Reversible Where Possible**: Some actions can be reviewed before execution
- **Clear Warnings**: Impact messages for destructive actions

## Default Retention Policies

- **Users**: 7 years (manual delete)
- **Bookings**: 3 years (auto-delete)
- **Payments**: 7 years (manual delete)
- **Audit Logs**: 5 years (auto-delete)

## Best Practices

1. **Regular Reviews**: Periodically review retention policies
2. **User Requests**: Handle GDPR requests promptly
3. **Incident Response**: Create incidents for all issues
4. **Documentation**: Add clear resolution notes
5. **Assignment**: Assign incidents to appropriate admins
6. **Tracking**: Keep incidents updated with progress

## Future Enhancements

- Automated data deletion based on policies
- Consent management UI for users
- Incident templates
- Automated incident creation from system alerts
- Compliance reporting
- Data export for user requests
