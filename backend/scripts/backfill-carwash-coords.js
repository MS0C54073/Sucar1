/**
 * Backfill location_coordinates for Lusaka car washes (run from backend folder).
 * Usage: node scripts/backfill-carwash-coords.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const LUSAKA_CENTER = { lat: -15.3875, lng: 28.3228 };
const AREAS = {
  'cairo road': { lat: -15.4167, lng: 28.2833 },
  'great east': { lat: -15.395, lng: 28.35 },
  makeni: { lat: -15.42, lng: 28.31 },
  woodlands: { lat: -15.43, lng: 28.28 },
  kabulonga: { lat: -15.4, lng: 28.34 },
  roma: { lat: -15.37, lng: 28.3 },
  northmead: { lat: -15.38, lng: 28.29 },
  chilenje: { lat: -15.44, lng: 28.32 },
  libala: { lat: -15.36, lng: 28.33 },
  chainda: { lat: -15.45, lng: 28.3 },
};

function resolve(location) {
  if (!location) return null;
  const t = location.toLowerCase();
  for (const [k, c] of Object.entries(AREAS)) {
    if (t.includes(k)) return c;
  }
  if (t.includes('lusaka')) return LUSAKA_CENTER;
  return null;
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: rows, error } = await supabase
    .from('users')
    .select('id, name, car_wash_name, location, location_coordinates')
    .eq('role', 'carwash');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  let updated = 0;
  for (const row of rows || []) {
    if (row.location_coordinates) continue;
    const coords = resolve(row.location);
    if (!coords) {
      console.log('Skip (not Lusaka):', row.car_wash_name || row.name);
      continue;
    }
    const { error: upErr } = await supabase
      .from('users')
      .update({ location_coordinates: JSON.stringify(coords) })
      .eq('id', row.id);
    if (upErr) {
      console.error('Update failed', row.id, upErr.message);
    } else {
      updated++;
      console.log('Updated', row.car_wash_name || row.name, coords);
    }
  }
  console.log(`Done. Updated ${updated} car washes.`);
}

main();
