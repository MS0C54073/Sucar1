# Database Migration Required

## Error
```
❌ Error fetching users: column users.approval_status does not exist
```

## Solution

You need to run the database migration **before** running the fix script.

### Step 1: Run the Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `backend/migrations/add-user-approval-fields.sql`
5. Click **Run** to execute the migration

### Step 2: Verify Migration

After running the migration, you can verify it worked by running this query in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'approval%';
```

You should see these columns:
- `approval_status`
- `created_by`
- `approved_by`
- `approval_notes`
- `approval_requested_at`
- `approved_at`
- `rejected_at`
- `rejection_reason`

### Step 3: Run the Fix Script

Once the migration is complete, run:

```bash
cd backend
npm run fix-approvals
```

## Migration File Location

The migration file is located at:
```
backend/migrations/add-user-approval-fields.sql
```

## What the Migration Does

The migration adds the following fields to the `users` table:
- `approval_status` - Status of user approval (pending, approved, rejected)
- `created_by` - Reference to the user who created this user
- `approved_by` - Reference to the admin who approved this user
- `approval_notes` - Optional notes from the approver
- `approval_requested_at` - When approval was requested
- `approved_at` - When user was approved
- `rejected_at` - When user was rejected
- `rejection_reason` - Reason for rejection

It also:
- Sets all existing users to `approval_status = 'approved'`
- Creates indexes for better query performance

## After Migration

Once the migration is complete:
1. All existing users will have `approval_status = 'approved'`
2. New users created by Sub-Admins will require approval
3. New users created by Admins will be auto-approved
4. You can see all car washes in the admin dashboard
