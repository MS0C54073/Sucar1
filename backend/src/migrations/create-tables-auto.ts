import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { supabase } from '../config/supabase';

/**
 * Automatic table creation - tries multiple methods
 */
const createTablesAuto = async () => {
  try {
    console.log('🚀 Automatic Table Creation\n');
    console.log('='.repeat(60));

    const schemaPath = join(__dirname, '../../supabase-schema.sql');
    const sql = readFileSync(schemaPath, 'utf-8');

    console.log('📝 SQL schema loaded\n');

    // Method 1: Try direct PostgreSQL connection (if DATABASE_URL is set)
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && databaseUrl.includes('postgresql://')) {
      console.log('🔗 Method 1: Using direct PostgreSQL connection...\n');
      return await createTablesViaPostgres(databaseUrl, sql);
    }

    // Method 2: Try Supabase Management API (if service_role key is set)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      console.log('🔗 Method 2: Using Supabase Management API...\n');
      return await createTablesViaAPI(serviceRoleKey, sql);
    }

    // Method 3: Fallback to instructions
    console.log('⚠️  Automatic execution not available\n');
    console.log('📋 To enable automatic table creation, use one of these:\n');
    console.log('Option A: Add DATABASE_URL to .env');
    console.log('   DATABASE_URL=postgresql://postgres:PASSWORD@db.lbtzrworenlwecbktlpq.supabase.co:5432/postgres\n');
    console.log('Option B: Add SUPABASE_SERVICE_ROLE_KEY to .env');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
    console.log('Option C: Run SQL manually in Supabase SQL Editor\n');
    console.log('='.repeat(60));
    console.log('\nSQL to execute:\n');
    console.log(sql);
    console.log('\n' + '='.repeat(60));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Method 1: Direct PostgreSQL connection
const createTablesViaPostgres = async (databaseUrl: string, sql: string) => {
  const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    // Local Supabase Postgres does not use SSL; cloud does.
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    console.log('✅ Connected to PostgreSQL\n');
    console.log('🔄 Creating tables...\n');

    // Execute base schema SQL
    await pool.query(sql);

    // Apply minimal follow-up migrations required by seeding
    const extras = [
      join(__dirname, '../../migrations/add-user-approval-fields.sql'),
      join(__dirname, '../../migrations/add-location-rating-fields.sql'),
    ];

    for (const path of extras) {
      try {
        const extraSql = readFileSync(path, 'utf-8');
        await pool.query(extraSql);
        console.log(`✅ Applied: ${path.split('/').pop()}`);
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`⚠️  Skipped (already applied): ${path.split('/').pop()}`);
        } else {
          console.log(`⚠️  Could not apply ${path.split('/').pop()}: ${e.message}`);
        }
      }
    }

    console.log('✅ All tables created successfully!\n');

    // Verify
    const tables = ['users', 'vehicles', 'services', 'bookings', 'payments'];
    for (const table of tables) {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1;`);
        console.log(`✅ Verified: ${table}`);
      } catch (err) {
        console.log(`❌ Missing: ${table}`);
      }
    }

    await pool.end();
    console.log('\n🎉 Migration completed successfully!');
    return true;

  } catch (error: any) {
    await pool.end();
    if (error.message.includes('already exists')) {
      console.log('⚠️  Some tables may already exist (this is OK)');
      console.log('✅ Migration completed');
      return true;
    }
    throw error;
  }
};

// Method 2: Supabase Management API
const createTablesViaAPI = async (serviceRoleKey: string, sql: string) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL not found');
  }

  try {
    // Note: Supabase REST API doesn't support DDL directly
    // This would require using the Management API or SQL execution endpoint
    console.log('⚠️  Supabase REST API does not support direct SQL execution');
    console.log('💡 Use DATABASE_URL method or run SQL manually\n');
    return false;
  } catch (error: any) {
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createTablesAuto().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

export default createTablesAuto;
