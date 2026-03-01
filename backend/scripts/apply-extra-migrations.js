require('dotenv').config();
const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

(async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not set in backend/.env');
      process.exit(1);
    }
    const isLocal = /(localhost|127\.0\.0\.1)/.test(databaseUrl);
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });

    const files = [
      join(__dirname, '../migrations/add-user-approval-fields.sql'),
      join(__dirname, '../migrations/add-location-rating-fields.sql'),
    ];

    for (const file of files) {
      const name = file.split(/[\\/]/).pop();
      try {
        const sql = readFileSync(file, 'utf-8');
        await pool.query(sql);
        console.log(`✅ Applied: ${name}`);
      } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        if (/already exists|duplicate column/i.test(msg)) {
          console.log(`⚠️  Skipped (already applied): ${name}`);
        } else {
          console.log(`❌ Failed to apply ${name}: ${msg}`);
          throw e;
        }
      }
    }

    await pool.end();
    console.log('🎉 Extra migrations completed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error running extra migrations:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
