# Admin Onboarding & Help System

## Overview

The SuCAR admin dashboard includes a comprehensive onboarding and help system to guide new admins and provide contextual assistance throughout the dashboard.

## Features

### 1. Welcome Screen
- Shown on first admin login
- Overview of key dashboard sections
- Option to start tour or skip
- Can be reset for re-onboarding

### 2. Progressive Onboarding
- Contextual tooltips that appear as admins navigate
- Highlights specific UI elements
- One section at a time to avoid overwhelm
- Progress tracked in localStorage
- Can be skipped at any time

### 3. Contextual Help Icons
- Small help icons (ℹ️) next to key sections
- Click to show brief help popup
- Non-intrusive, available on demand
- Integrated into component headers

### 4. Help Center
- Searchable documentation
- Category-based navigation
- All onboarding sections available
- Accessible from sidebar (❓ button)
- Can be opened anytime

### 5. Onboarding Sections

The system includes help for:
- Dashboard Overview
- User Management
- Role & Permission Management
- User Suspension
- Booking Management
- Analytics & Insights
- Financial Overview
- Feature Flags
- Compliance & Data Governance
- Incident Management
- Audit Logs
- System Alerts

## Usage

### For New Admins

1. **First Login**: Welcome screen appears
2. **Start Tour**: Click "Start Tour" to begin progressive onboarding
3. **Follow Tooltips**: Complete each section as you navigate
4. **Skip Anytime**: Click "Skip" to dismiss current tooltip or skip entire tour
5. **Revisit Help**: Click ❓ button in sidebar anytime

### For Existing Admins

1. **Help Center**: Click ❓ button in sidebar
2. **Search**: Type keywords to find relevant help
3. **Browse Categories**: Filter by dashboard section
4. **Contextual Help**: Click ℹ️ icons next to sections

### Resetting Onboarding

To reset onboarding (for testing or re-onboarding):
```javascript
// In browser console
localStorage.removeItem('admin_onboarding_completed');
localStorage.removeItem('admin_onboarding_skipped');
// Refresh page
```

## Technical Details

### Onboarding Service

The `OnboardingService` manages:
- Completed sections tracking (localStorage)
- Skip state
- Section lookup by component
- Progress management

### Tooltip System

- **OnboardingTooltip**: Full-screen overlay with tooltip
- Highlights target elements
- Auto-positions based on element location
- Smooth animations
- Dismissible

### Help Components

- **HelpCenter**: Modal with search and categories
- **ContextualHelp**: Inline help icon with popup
- **OnboardingWelcome**: First-time welcome screen

## Customization

### Adding New Onboarding Sections

Edit `frontend/src/services/onboarding-service.ts`:

```typescript
export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  // ... existing sections
  {
    id: 'new-section',
    title: 'New Section Title',
    description: 'Description of what this section does',
    component: 'ComponentName',
    targetSelector: '.css-selector', // Optional
    position: 'bottom', // Optional
  },
];
```

### Adding Contextual Help

In any component:
```tsx
import ContextualHelp from './ContextualHelp';

<div className="section-header">
  <h2>Section Title</h2>
  <ContextualHelp sectionId="section-id" />
</div>
```

## Database Migration (Optional)

The migration `add-admin-onboarding.sql` creates a table for server-side tracking. This is optional - the system works with localStorage alone.

## Best Practices

1. **Keep Descriptions Concise**: Tooltips should be brief and actionable
2. **Highlight Key Actions**: Focus on critical workflows
3. **Update Regularly**: Keep help content current with UI changes
4. **Test Onboarding**: Regularly test the onboarding flow
5. **Gather Feedback**: Ask new admins about onboarding experience

## Future Enhancements

- Video tutorials
- Interactive walkthroughs
- Role-specific onboarding
- Onboarding analytics
- Multi-language support
- Help content management UI
