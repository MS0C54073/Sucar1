// Load env vars FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/database';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler';

// Routes
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import driverRoutes from './routes/driverRoutes';
import carWashRoutes from './routes/carWashRoutes';
import adminRoutes from './routes/adminRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import paymentRoutes from './routes/paymentRoutes';
import chatRoutes from './routes/chatRoutes';
import queueRoutes from './routes/queueRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import locationRoutes from './routes/locationRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Connect to database
connectDB().then(async () => {
  // Auto-create tables if they don't exist (only if DATABASE_URL is set)
  const { initDatabase } = await import('./migrations/init-database');
  await initDatabase();
}).catch((error) => {
  console.error('Database setup error:', error);
});

const app = express();

// CORS configuration - inline headers
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://10.0.2.2:5000',   // Android emulator
  'http://10.0.2.2:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

// Inline CORS middleware
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/carwash', carWashRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/locations', locationRoutes);  // ✅ Phase 1: Location tracking
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SuCAR API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT: number = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for mobile access

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 SuCAR API Server`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Host: ${HOST}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Mobile (Android): http://10.0.2.2:${PORT}/api/health`);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error('\n💡 To fix this:');
    console.error(`   1. Kill the process using port ${PORT}:`);
    console.error(`      Windows: netstat -ano | findstr :${PORT}`);
    console.error(`      Then: taskkill /F /PID <process_id>`);
    console.error(`   2. Or use the helper script: .\\kill-port.ps1`);
    console.error(`   3. Or change the port in .env: PORT=5001\n`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});
