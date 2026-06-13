/**
 * Seed Data Script for SuCAR System
 * Creates: 5 clients, 10 car washes, 10 drivers with ratings
 * Usage: node scripts/seed-data.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Helper function to generate random coordinates (Lusaka, Zambia area)
function generateCoordinates() {
  // Lusaka coordinates: -15.3875, 28.3228
  const baseLat = -15.3875;
  const baseLng = 28.3228;
  // TIGHT CLUSTERING: 2-3km radius to ensure visibility in app
  const latOffset = (Math.random() - 0.5) * 0.04;
  const lngOffset = (Math.random() - 0.5) * 0.04;
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

// Seed Clients
const clients = [
  { name: 'John Mwansa', email: 'john.mwansa@email.com', phone: '0977123456', nrc: 'CLI001', password: 'client123' },
  { name: 'Sarah Banda', email: 'sarah.banda@email.com', phone: '0977123457', nrc: 'CLI002', password: 'client123' },
  { name: 'Peter Phiri', email: 'peter.phiri@email.com', phone: '0977123458', nrc: 'CLI003', password: 'client123' },
  { name: 'Mary Tembo', email: 'mary.tembo@email.com', phone: '0977123459', nrc: 'CLI004', password: 'client123' },
  { name: 'David Ngoma', email: 'david.ngoma@email.com', phone: '0977123460', nrc: 'CLI005', password: 'client123' },
];

// Seed Car Washes with locations and coordinates
const carWashes = [
  { name: 'Sparkle Auto Wash', location: 'Cairo Road, Lusaka', washingBays: 3, email: 'sparkle@carwash.com', phone: '0211234567', nrc: 'CW001', password: 'carwash123' },
  { name: 'Crystal Clean Car Wash', location: 'Great East Road, Lusaka', washingBays: 4, email: 'crystal@carwash.com', phone: '0211234568', nrc: 'CW002', password: 'carwash123' },
  { name: 'Shine Bright Car Care', location: 'Makeni Road, Lusaka', washingBays: 2, email: 'shine@carwash.com', phone: '0211234569', nrc: 'CW003', password: 'carwash123' },
  { name: 'Premium Wash Center', location: 'Woodlands, Lusaka', washingBays: 5, email: 'premium@carwash.com', phone: '0211234570', nrc: 'CW004', password: 'carwash123' },
  { name: 'Quick Wash Express', location: 'Kabulonga, Lusaka', washingBays: 2, email: 'quick@carwash.com', phone: '0211234571', nrc: 'CW005', password: 'carwash123' },
  { name: 'Elite Car Spa', location: 'Roma, Lusaka', washingBays: 3, email: 'elite@carwash.com', phone: '0211234572', nrc: 'CW006', password: 'carwash123' },
  { name: 'Auto Shine Pro', location: 'Northmead, Lusaka', washingBays: 4, email: 'autoshine@carwash.com', phone: '0211234573', nrc: 'CW007', password: 'carwash123' },
  { name: 'Mega Wash Hub', location: 'Chilenje, Lusaka', washingBays: 6, email: 'mega@carwash.com', phone: '0211234574', nrc: 'CW008', password: 'carwash123' },
  { name: 'Spotless Auto Care', location: 'Libala, Lusaka', washingBays: 3, email: 'spotless@carwash.com', phone: '0211234575', nrc: 'CW009', password: 'carwash123' },
  { name: 'Ultra Clean Services', location: 'Chainda, Lusaka', washingBays: 2, email: 'ultra@carwash.com', phone: '0211234576', nrc: 'CW010', password: 'carwash123' },
];

// Seed Drivers with ratings
const drivers = [
  { name: 'James Mulenga', email: 'james.mulenga@driver.com', phone: '0978123456', nrc: 'DRV001', password: 'driver123', licenseNo: 'DL001', licenseType: 'Class B', rating: 4.8, completedJobs: 150 },
  { name: 'Michael Chanda', email: 'michael.chanda@driver.com', phone: '0978123457', nrc: 'DRV002', password: 'driver123', licenseNo: 'DL002', licenseType: 'Class B', rating: 4.5, completedJobs: 120 },
  { name: 'Robert Mwanza', email: 'robert.mwanza@driver.com', phone: '0978123458', nrc: 'DRV003', password: 'driver123', licenseNo: 'DL003', licenseType: 'Class C', rating: 4.9, completedJobs: 200 },
  { name: 'Thomas Banda', email: 'thomas.banda@driver.com', phone: '0978123459', nrc: 'DRV004', password: 'driver123', licenseNo: 'DL004', licenseType: 'Class B', rating: 4.2, completedJobs: 80 },
  { name: 'Andrew Phiri', email: 'andrew.phiri@driver.com', phone: '0978123460', nrc: 'DRV005', password: 'driver123', licenseNo: 'DL005', licenseType: 'Class B', rating: 4.7, completedJobs: 180 },
  { name: 'Daniel Tembo', email: 'daniel.tembo@driver.com', phone: '0978123461', nrc: 'DRV006', password: 'driver123', licenseNo: 'DL006', licenseType: 'Class C', rating: 4.6, completedJobs: 140 },
  { name: 'Mark Ngoma', email: 'mark.ngoma@driver.com', phone: '0978123462', nrc: 'DRV007', password: 'driver123', licenseNo: 'DL007', licenseType: 'Class B', rating: 4.4, completedJobs: 100 },
  { name: 'Paul Mwila', email: 'paul.mwila@driver.com', phone: '0978123463', nrc: 'DRV008', password: 'driver123', licenseNo: 'DL008', licenseType: 'Class B', rating: 4.3, completedJobs: 90 },
  { name: 'Steven Lungu', email: 'steven.lungu@driver.com', phone: '0978123464', nrc: 'DRV009', password: 'driver123', licenseNo: 'DL009', licenseType: 'Class C', rating: 4.9, completedJobs: 220 },
  { name: 'Brian Mbewe', email: 'brian.mbewe@driver.com', phone: '0978123465', nrc: 'DRV010', password: 'driver123', licenseNo: 'DL010', licenseType: 'Class B', rating: 4.1, completedJobs: 70 },
];

// Service types
const serviceTypes = ['Full Basic Wash', 'Engine Wash', 'Exterior Wash', 'Interior Wash', 'Wax and Polishing'];

// Service prices (randomized per car wash)
function generateServices(carWashId) {
  const services = [];
  const basePrices = {
    'Full Basic Wash': 50,
    'Engine Wash': 80,
    'Exterior Wash': 40,
    'Interior Wash': 60,
    'Wax and Polishing': 100
  };

  serviceTypes.forEach(serviceName => {
    // Add some variation to prices (±20%)
    const variation = 1 + (Math.random() - 0.5) * 0.4;
    const price = Math.round(basePrices[serviceName] * variation);

    services.push({
      car_wash_id: carWashId,
      name: serviceName,
      description: `Professional ${serviceName.toLowerCase()} service`,
      price: price,
      is_active: true
    });
  });

  return services;
}

async function upsertUser(userData, roleSpecificData = {}) {
  // Check if exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', userData.email)
    .single();

  // Always generate FRESH clustered coordinates
  const coords = generateCoordinates();

  const payload = {
    ...userData,
    ...roleSpecificData,
    location_coordinates: JSON.stringify(coords), // Update Coords!
    updated_at: new Date().toISOString()
  };

  if (existing) {
    console.log(`♻️  Updating ${userData.name}...`);
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { user: data, isNew: false };
  } else {
    console.log(`✨ Creating ${userData.name}...`);
    const { data, error } = await supabase
      .from('users')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return { user: data, isNew: true };
  }
}

async function seedData() {
  console.log('🌱 Starting ROBUST seed data creation...\n');

  const credentials = {
    clients: [],
    carWashes: [],
    drivers: []
  };

  try {
    // 0. Ensure default admin
    console.log('👑 Processing default admin...');
    const adminHashed = await hashPassword('admin123');
    await upsertUser({
      name: 'Admin User',
      email: 'admin@sucar.com',
      password: adminHashed,
      phone: '+260970000000',
      nrc: 'ADMIN001',
      role: 'admin',
      is_active: true,
      admin_level: 'super_admin',
    });

    // 1. Create Clients
    console.log('📝 Processing clients...');
    for (const client of clients) {
      const hashedPassword = await hashPassword(client.password);

      const { user, isNew } = await upsertUser({
        name: client.name,
        email: client.email,
        password: hashedPassword,
        phone: client.phone,
        nrc: client.nrc,
        role: 'client',
        is_active: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString()
      });

      if (user) {
        credentials.clients.push({ ...client });

        // Random 1-5 vehicles
        const numVehicles = Math.floor(Math.random() * 5) + 1;
        console.log(`   🚗 Ensuring ${numVehicles} vehicles for ${client.name}`);

        const manufacturers = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Ford', 'BMW', 'Mercedes'];
        const colors = ['White', 'Black', 'Silver', 'Blue', 'Red', 'Grey'];

        // Clear existing vehicles to avoid duplicates or enforce fresh list
        // Actually, let's just add if we need more, but deleting old ones is cleaner for "mock state".
        // But deleting might break bookings. So we just ADD new ones if count is low.

        for (let i = 0; i < numVehicles; i++) {
          const make = manufacturers[Math.floor(Math.random() * manufacturers.length)];
          const model = 'Model ' + String.fromCharCode(65 + Math.floor(Math.random() * 26));

          // Just insert, ignore error if similar exists
          await supabase
            .from('vehicles')
            .insert({
              client_id: user.id,
              make: make,
              model: model,
              plate_no: `ABC ${Math.floor(Math.random() * 9000) + 1000}`,
              color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
      }
    }

    // 2. Create Car Washes
    console.log('\n🧼 Processing car washes...');
    for (const carWash of carWashes) {
      const hashedPassword = await hashPassword(carWash.password);

      const { user } = await upsertUser({
        name: carWash.name,
        email: carWash.email,
        password: hashedPassword,
        phone: carWash.phone,
        nrc: carWash.nrc,
        role: 'carwash',
        is_active: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString()
      }, {
        car_wash_name: carWash.name,
        location: carWash.location,
        washing_bays: carWash.washingBays,
      });

      if (user) {
        credentials.carWashes.push({ ...carWash });

        // Ensure services exist
        // Delete old services to re-generate with fresh prices/list?
        // Safer to just check if count is low.
        const { count } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('car_wash_id', user.id);

        if (count < 5) {
          const services = generateServices(user.id);
          for (const service of services) {
            await supabase.from('services').insert(service);
          }
          console.log(`   ✨ Added services for ${carWash.name}`);
        }
      }
    }

    // 3. Create Drivers
    console.log('\n🚗 Processing drivers...');
    for (const driver of drivers) {
      const hashedPassword = await hashPassword(driver.password);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);

      const { user } = await upsertUser({
        name: driver.name,
        email: driver.email,
        password: hashedPassword,
        phone: driver.phone,
        nrc: driver.nrc,
        role: 'driver',
        is_active: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString()
      }, {
        availability: true, // FORCE AVAILABLE
        license_no: driver.licenseNo,
        license_type: driver.licenseType,
        license_expiry: expiryDate.toISOString().split('T')[0],
        address: 'Lusaka, Zambia',
        marital_status: Math.random() > 0.5 ? 'Married' : 'Single',
        driver_rating: driver.rating,
        completed_jobs: driver.completedJobs
      });

      if (user) {
        credentials.drivers.push({ ...driver });
      }
    }

    console.log('\n✅ ROBUST Seed data creation completed!\n');
    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS');
    console.log('='.repeat(60));

    // ... (Detailed logging same as before, simplified for brevity here) ...
    console.log('Use SEED_DATA_CREDENTIALS.md for full list.');

    // Save credentials to file
    fs.writeFileSync(
      'SEED_DATA_CREDENTIALS.md',
      generateCredentialsMarkdown(credentials)
    );
    console.log('\n📄 Credentials saved to: SEED_DATA_CREDENTIALS.md');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

function generateCredentialsMarkdown(credentials) {
  let markdown = '# SuCAR Seed Data - Login Credentials\n\n';
  markdown += 'This file contains login credentials for all seeded users.\n\n';
  markdown += '## 📱 Clients (5)\n\n';

  credentials.clients.forEach((c, i) => {
    markdown += `### ${i + 1}. ${c.name}\n`;
    markdown += `- **Email**: ${c.email}\n`;
    markdown += `- **Password**: ${c.password}\n`;
    markdown += `- **Role**: Client\n\n`;
  });

  markdown += '## 🧼 Car Washes (10)\n\n';
  credentials.carWashes.forEach((cw, i) => {
    markdown += `### ${i + 1}. ${cw.name}\n`;
    markdown += `- **Email**: ${cw.email}\n`;
    markdown += `- **Password**: ${cw.password}\n`;
    markdown += `- **Role**: Car Wash\n`;
    markdown += `- **Location**: ${cw.location}\n\n`;
  });

  markdown += '## 🚗 Drivers (10)\n\n';
  credentials.drivers.forEach((d, i) => {
    markdown += `### ${i + 1}. ${d.name}\n`;
    markdown += `- **Email**: ${d.email}\n`;
    markdown += `- **Password**: ${d.password}\n`;
    markdown += `- **Role**: Driver\n`;
    markdown += `- **Rating**: ${d.rating}/5.0\n`;
    markdown += `- **Completed Jobs**: ${d.completedJobs}\n\n`;
  });

  markdown += '---\n\n';
  markdown += '**Login URL**: http://localhost:5173/login\n\n';
  markdown += '**Note**: All passwords are simple for testing purposes. Change them in production!\n';

  return markdown;
}

seedData();
