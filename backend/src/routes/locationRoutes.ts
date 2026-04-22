/**
 * Location Routes
 * 
 * API routes for location tracking and management
 */

import { Router, Request, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  updateLocation,
  getDriverLocation,
  getBookingLocation,
  getActiveDriverLocations,
  getBookingLocationHistory,
} from '../controllers/locationController';
import { DBService } from '../services/db-service';

const router = Router();

// All location routes require authentication
router.use(protect);

// Update driver location
router.post('/update', updateLocation);

// Get driver location
router.get('/driver/:driverId', getDriverLocation);

// Get booking location
router.get('/booking/:bookingId', getBookingLocation);

// Get location history for booking
router.get('/booking/:bookingId/history', getBookingLocationHistory);

// Get all active driver locations (admin only)
router.get('/drivers/active', getActiveDriverLocations);

// NEW ENDPOINTS FOR PHASE 1

// POST /api/locations/update-location - Update user's current location (GPS stream)
router.post('/update-location', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, accuracyMeters } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const location = await DBService.createOrUpdateLocation(userId, latitude, longitude, accuracyMeters);
    res.status(200).json({ data: location });
  } catch (error: any) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/locations/me - Get user's own location
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const location = await DBService.getUserLocation(userId);
    res.status(200).json({ data: location });
  } catch (error: any) {
    console.error('Error fetching user location:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nearby-carwashes - Get nearby car washes with radius search
router.post('/nearby-carwashes', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radiusKm = 10 } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    if (typeof radiusKm !== 'number' || radiusKm <= 0) {
      return res.status(400).json({ error: 'Invalid radius' });
    }

    const carWashes = await DBService.getNearbyCarWashes(latitude, longitude, radiusKm);
    res.status(200).json({ data: carWashes });
  } catch (error: any) {
    console.error('Error fetching nearby car washes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/locations/booking-counterparty/:bookingId - Get counterparty location for active booking
router.get('/booking-counterparty/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const location = await DBService.getBookingCounterpartyLocation(bookingId, userId);
    res.status(200).json({ data: location });
  } catch (error: any) {
    console.error('Error fetching counterparty location:', error);
    res.status(403).json({ error: error.message });
  }
});

export default router;
