/**
 * Update a specific admin user's password
 * Usage: node scripts/update-admin-password.js <email> <newPassword>
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.error('Usage: node scripts/update-admin-password.js <email> <newPassword>');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log(`🔐 Updating password for ${email} ...`);

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .ilike('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message || fetchError);
      process.exit(1);
    }

    if (!user) {
      console.error('❌ User not found.');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashed, is_active: true, role: user.role || 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message || updateError);
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log('   Email:', email);
    console.log('   New Password:', newPassword);
  } catch (e) {
    console.error('❌ Unexpected error:', e.message || e);
    process.exit(1);
  }
}

run();
