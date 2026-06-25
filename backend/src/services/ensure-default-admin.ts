import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

const DEFAULT_ADMIN = {
  email: 'admin@sucar.com',
  password: 'admin123',
  name: 'Admin User',
  phone: '+260970000000',
  nrc: 'ADMIN001',
};

/**
 * Ensures a default admin exists with a known bcrypt password hash.
 * Safe to run on every startup (no-op if admin exists with valid password).
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    // SECURITY: never seed a known-password admin in production. A default
    // admin@sucar.com / admin123 in prod is a full account-takeover risk.
    // Create the first admin via a controlled one-off script instead.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEFAULT_ADMIN !== 'true') {
      console.warn(
        '[security] Skipping default-admin seeding in production. ' +
          'Provision the first admin out-of-band (or set ALLOW_DEFAULT_ADMIN=true to override).'
      );
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('id, email, password, is_active')
      .eq('email', DEFAULT_ADMIN.email)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('⚠️  Could not verify default admin:', fetchError.message);
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    if (!existing) {
      const { error: insertError } = await supabase.from('users').insert({
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        password: hashedPassword,
        phone: DEFAULT_ADMIN.phone,
        nrc: DEFAULT_ADMIN.nrc,
        role: 'admin',
        is_active: true,
        admin_level: 'super_admin',
      });

      if (insertError) {
        console.warn('⚠️  Could not create default admin:', insertError.message);
        return;
      }

      console.log('✅ Default admin created (admin@sucar.com / admin123)');
      return;
    }

    const storedPassword = existing.password as string | null;
    const passwordValid =
      storedPassword &&
      (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) &&
      (await bcrypt.compare(DEFAULT_ADMIN.password, storedPassword));

    if (!passwordValid || existing.is_active === false) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          is_active: true,
          role: 'admin',
        })
        .eq('id', existing.id);

      if (updateError) {
        console.warn('⚠️  Could not repair default admin:', updateError.message);
        return;
      }

      console.log('✅ Default admin account repaired (admin@sucar.com / admin123)');
    }
  } catch (err: any) {
    console.warn('⚠️  ensureDefaultAdmin skipped:', err.message);
  }
}
