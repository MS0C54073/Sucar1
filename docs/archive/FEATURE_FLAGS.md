# Feature Flags & Rollouts Management

## Overview

The SuCAR admin dashboard now includes a comprehensive feature flags and rollouts management system, allowing admins to control system features without redeployment.

## Features

### 1. Feature Flag Management
- **Create**: Add new feature flags (Super Admin only)
- **Update**: Modify feature flag settings (status, rollout, roles)
- **Delete**: Remove feature flags (Super Admin only)
- **View**: See all feature flags with their current state

### 2. Status Control
- **Active**: Feature enabled for all eligible users
- **Inactive**: Feature disabled for all users
- **Limited**: Gradual rollout with percentage control

### 3. Rollout Strategies
- **Role-based**: Enable for specific user roles (client, driver, carwash, admin)
- **Percentage-based**: Gradual rollout (0-100%) for limited rollouts
- **Combined**: Role + percentage for precise control

### 4. Safety Features
- **Confirmation Dialogs**: All status changes require confirmation
- **Impact Warnings**: Clear messages about who will be affected
- **Audit Logging**: All changes logged with admin ID and timestamp
- **Fast Rollback**: One-click disable for immediate rollback

### 5. Visibility
- **Impact Scope**: Shows exactly who will see the feature
- **Last Updated**: Timestamp of last change
- **Change History**: Tracked in audit logs

## Database Migration

**IMPORTANT:** Run this SQL migration in Supabase SQL Editor:

```sql
-- See backend/migrations/add-feature-flags.sql
```

The migration creates:
- `feature_flags` table
- Indexes for performance
- Default feature flags (examples)
- Updated timestamp trigger

## API Endpoints

### Feature Flag Management
- `GET /api/admin/feature-flags` - Get all feature flags
- `GET /api/admin/feature-flags/:id` - Get single feature flag
- `POST /api/admin/feature-flags` - Create feature flag (Super Admin only)
- `PUT /api/admin/feature-flags/:id` - Update feature flag
- `DELETE /api/admin/feature-flags/:id` - Delete feature flag (Super Admin only)

### Feature Check (for frontend/API)
- `GET /api/admin/feature-flags/check/:name` - Check if feature is enabled for current user

## Usage Examples

### Creating a Feature Flag

1. Navigate to Admin Dashboard → Feature Flags
2. Click "+ Create Feature Flag"
3. Fill in:
   - Name: `new_payment_method`
   - Description: "Mobile money payment integration"
   - Status: `inactive`
   - Enabled Roles: `client` (optional)
4. Click "Create Feature Flag"

### Gradual Rollout

1. Edit the feature flag
2. Set Status to "Limited Rollout"
3. Set Rollout Percentage (e.g., 25%)
4. Select enabled roles (e.g., `client`)
5. Save changes
6. Feature will be enabled for 25% of clients

### Full Activation

1. Edit the feature flag
2. Set Status to "Active"
3. Set Rollout Percentage to 100%
4. Save changes
5. Feature enabled for all eligible users

### Emergency Disable

1. Find the feature flag
2. Click "Disable" button
3. Confirm the action
4. Feature immediately disabled for all users

## Rollout Logic

### Percentage-Based Rollout
- Uses deterministic hashing based on `userId + featureName`
- Ensures consistent behavior: same user always sees same state
- Percentage determines how many users see the feature

### Role-Based Filtering
- If roles specified: only those roles can see the feature
- If empty: all roles can see the feature (if percentage allows)

### Combined Logic
1. Check if feature is inactive → return false
2. Check if user role is in enabled roles (if specified) → return false if not
3. For limited rollout: hash userId + featureName → check if within percentage
4. For active (100%): return true if role check passes

## Permission Levels

- **Super Admin**: Can create and delete feature flags
- **Admin**: Can update feature flags (status, rollout, roles)
- **Support**: Read-only access

## Integration with Audit Logs

All feature flag changes are automatically logged:
- `feature_flag_created` - When a flag is created
- `feature_flag_updated` - When a flag is updated (includes old/new values)
- `feature_flag_deleted` - When a flag is deleted

View changes in Admin Dashboard → Audit Logs

## Frontend Usage

### Checking Feature Flags in Code

```typescript
// In your component
const { data } = useQuery({
  queryKey: ['feature-flag', 'live_tracking'],
  queryFn: async () => {
    const response = await api.get('/admin/feature-flags/check/live_tracking');
    return response.data.data.enabled;
  },
});

if (data) {
  // Feature is enabled, show UI
}
```

## Best Practices

1. **Start with Inactive**: Create flags as inactive, test, then roll out
2. **Gradual Rollouts**: Use limited rollout (10%, 25%, 50%) before full activation
3. **Monitor Impact**: Check audit logs and user feedback during rollouts
4. **Fast Rollback**: Keep "Disable" button accessible for emergencies
5. **Clear Names**: Use descriptive names (e.g., `live_tracking`, not `feature_1`)
6. **Documentation**: Always add descriptions explaining what the feature does

## Default Feature Flags

The migration includes example flags:
- `live_tracking` - Active for clients and drivers
- `advanced_analytics` - Limited (50%) for admins
- `mobile_payments` - Inactive

## Safety Considerations

- **Confirmation Required**: All status changes require confirmation
- **Impact Warnings**: Clear messages about who will be affected
- **Audit Trail**: Complete history of all changes
- **Fast Rollback**: One-click disable for emergencies
- **Permission Checks**: Only authorized admins can modify flags

## Future Enhancements

- Region-based rollouts
- Time-based activation (schedule features)
- A/B testing support
- Feature flag analytics (adoption rates)
- Bulk operations
- Feature flag templates
