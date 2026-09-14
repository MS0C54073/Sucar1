/**
 * Location Controller
 * 
 * Handles location-related API endpoints
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LocationTrackingService, LocationUpdate } from '../services/locationTrackingService';

/**
 * Update driver location
 * POST /api/location/update
 */
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { coordinates, bookingId, accuracy, heading, speed, status } = req.body;

    // Validate coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Must include lat and lng as numbers.',
      });
      return;
    }

    // Validate lat/lng range
    if (coordinates.lat < -90 || coordinates.lat > 90 || 
        coordinates.lng < -180 || coordinates.lng > 180) {
      res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range.',
      });
      return;
    }

    const update: LocationUpdate = {
      userId,
      bookingId: bookingId || undefined,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      accuracy: accuracy || undefined,
      heading: heading || undefined,
      speed: speed || undefined,
      status: status || 'idle',
    };

    await LocationTrackingService.updateDriverLocation(update);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        coordinates: update.coordinates,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update location',
    });
  }
};

/**
 * Get driver's current location
 * GET /api/location/driver/:driverId
 */
export const getDriverLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    // Direct driver lookup is limited to the driver and privileged operators.
    // Booking-scoped access is handled by getBookingLocation instead.
    if (!['admin', 'subadmin'].includes(requestingUserRole) && driverId !== requestingUserId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot access other driver locations',
      });
      return;
    }

    const location = await LocationTrackingService.getDriverLocation(driverId);

    if (!location) {
      res.status(404).json({
        success: false,
        message: 'Driver location not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        coordinates: location,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching driver location:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch driver location',
    });
  }
};

/**
 * Get booking location data
 * GET /api/location/booking/:bookingId
 */
export const getBookingLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const location = await LocationTrackingService.getBookingLocation(
      bookingId,
      requestingUserId,
      requestingUserRole
    );

    if (!location) {
      res.status(404).json({
        success: false,
        message: 'Booking location not found',
      });
      return;
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    console.error('Error fetching booking location:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch booking location',
    });
  }
};

/**
 * Get all active driver locations (admin only)
 * GET /api/location/drivers/active
 */
export const getActiveDriverLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestingUserRole = req.user!.role;

    if (requestingUserRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required',
      });
      return;
    }

    const drivers = await LocationTrackingService.getActiveDriverLocations();

    res.json({
      success: true,
      data: drivers,
    });
  } catch (error: any) {
    console.error('Error fetching active drivers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active drivers',
    });
  }
};

/**
 * Get location history for a booking
 * GET /api/location/booking/:bookingId/history
 */
export const getBookingLocationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify access to booking
    await LocationTrackingService.getBookingLocation(
      bookingId,
      requestingUserId,
      requestingUserRole
    );

    const history = await LocationTrackingService.getBookingLocationHistory(bookingId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching location history:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch location history',
    });
  }
};
