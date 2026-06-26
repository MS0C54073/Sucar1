# 🚨 URGENT: Fix Services Constraint Error

## The Problem
You're getting this error:
```
new row for relation "services" violates check constraint "services_name_check"
```

This means the database still has a restrictive constraint that only allows 5 predefined service names.

## ✅ THE FIX (Do This Now)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Paste This SQL

```sql
-- Drop the problematic constraint
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_name_check;

-- Add a simple constraint that only checks name is not empty
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_name_not_empty;
ALTER TABLE services 
ADD CONSTRAINT services_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0 AND LENGTH(name) <= 100);
```

### Step 3: Run It
1. Click the **Run** button (or press Ctrl+Enter)
2. You should see "Success. No rows returned"

### Step 4: Verify It Worked
Run this to check:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'services'::regclass 
AND conname LIKE '%name%';
```

You should see `services_name_not_empty` (not `services_name_check`)

## ✅ Done!

Now car washes can:
- ✅ Add any service name (not just the 5 predefined ones)
- ✅ Add up to 20 services per car wash
- ✅ Use custom service names from the package list or manual entry

## If It Still Doesn't Work

If you still get the error after running the SQL:

1. **Check constraint name**: The constraint might have a different name. Run this to find it:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'services'::regclass;
```

2. **Drop all name-related constraints**:

```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'services'::regclass
        AND contype = 'c'
        AND (
            pg_get_constraintdef(oid) LIKE '%Full Basic Wash%' OR
            pg_get_constraintdef(oid) LIKE '%name IN%'
        )
    LOOP
        EXECUTE 'ALTER TABLE services DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped: %', r.conname;
    END LOOP;
END $$;
```

3. **Then add the new constraint**:

```sql
ALTER TABLE services 
ADD CONSTRAINT services_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0 AND LENGTH(name) <= 100);
```
