/**
 * Recommendation Controller
 * Handles API requests for recommendations and nearby searches
 */

import { Request, Response } from 'express';
import {
  recommendCarWashes,
  recommendDrivers,
  getNearbyCarWashes,
  getNearbyDrivers
} from '../services/recommendationService';

/**
 * Get recommended car washes for a user
 */
export const getRecommendedCarWashes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, serviceType, maxDistance } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: 'Location coordinates (lat, lng) are required'
      });
      return;
    }

    const userLocation = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const recommendations = await recommendCarWashes(
      userLocation,
      serviceType as string | undefined,
      maxDistance ? parseFloat(maxDistance as string) : 10
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error: any) {
    console.error('Error getting recommended car washes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
};

/**
 * Get recommended drivers for a user
 */
export const getRecommendedDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, maxDistance } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: 'Location coordinates (lat, lng) are required'
      });
      return;
    }

    const userLocation = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const recommendations = await recommendDrivers(
      userLocation,
      maxDistance ? parseFloat(maxDistance as string) : 15
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error: any) {
    console.error('Error getting recommended drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
};

/**
 * Get nearby car washes
 */
export const getNearbyCarWashesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: 'Location coordinates (lat, lng) are required'
      });
      return;
    }

    const userLocation = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const nearby = await getNearbyCarWashes(
      userLocation,
      radius ? parseFloat(radius as string) : 10
    );

    res.json({
      success: true,
      data: nearby,
      count: nearby.length
    });
  } catch (error: any) {
    console.error('Error getting nearby car washes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby car washes',
      error: error.message
    });
  }
};

/**
 * Get nearby drivers
 */
export const getNearbyDriversController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: 'Location coordinates (lat, lng) are required'
      });
      return;
    }

    const userLocation = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const nearby = await getNearbyDrivers(
      userLocation,
      radius ? parseFloat(radius as string) : 15
    );

    res.json({
      success: true,
      data: nearby,
      count: nearby.length
    });
  } catch (error: any) {
    console.error('Error getting nearby drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby drivers',
      error: error.message
    });
  }
};
