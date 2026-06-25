/**
 * AI Recommendation Service
 * Provides intelligent recommendations for car washes and drivers
 * based on location, ratings, availability, and user preferences
 */

import { supabase } from '../config/supabase';

interface Location {
  lat: number;
  lng: number;
}

interface RecommendationScore {
  id: string;
  score: number;
  reasons: string[];
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Recommend car washes based on location, ratings, and availability
 */
export async function recommendCarWashes(
  userLocation: Location,
  serviceType?: string,
  maxDistance: number = 10 // km
): Promise<any[]> {
  try {
    // Fetch all active car washes
    const { data: carWashes, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'carwash')
      .eq('is_active', true);

    if (error) throw error;
    if (!carWashes) return [];

    // Calculate recommendation scores
    const scoredCarWashes: (any & { score: number; distance: number; reasons: string[] })[] = [];

    for (const carWash of carWashes) {
      let score = 0;
      const reasons: string[] = [];
      let distance = 0;

      // 1. Location Score (40% weight) - Closer is better
      if (carWash.location_coordinates) {
        try {
          const coords = typeof carWash.location_coordinates === 'string' 
            ? JSON.parse(carWash.location_coordinates)
            : carWash.location_coordinates;
          
          distance = calculateDistance(userLocation, coords);
          
          if (distance <= maxDistance) {
            // Score: 40 points for 0km, decreasing to 0 at maxDistance
            const locationScore = Math.max(0, 40 * (1 - distance / maxDistance));
            score += locationScore;
            reasons.push(`Close location (${distance.toFixed(1)}km away)`);
          } else {
            continue; // Skip if too far
          }
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
      }

      // 2. Service Availability Score (30% weight)
      if (serviceType) {
        const { data: services } = await supabase
          .from('services')
          .select('*')
          .eq('car_wash_id', carWash.id)
          .eq('name', serviceType)
          .eq('is_active', true)
          .maybeSingle();

        if (services) {
          score += 30;
          reasons.push(`Offers ${serviceType}`);
        }
      } else {
        // If no specific service, check if they have multiple services
        const { data: services } = await supabase
          .from('services')
          .select('id')
          .eq('car_wash_id', carWash.id)
          .eq('is_active', true);

        if (services && services.length >= 3) {
          score += 30;
          reasons.push(`Wide range of services (${services.length} available)`);
        }
      }

      // 3. Capacity Score (20% weight) - More bays = better
      if (carWash.washing_bays) {
        const capacityScore = Math.min(20, carWash.washing_bays * 4);
        score += capacityScore;
        reasons.push(`${carWash.washing_bays} washing bay${carWash.washing_bays > 1 ? 's' : ''}`);
      }

      // 4. Customer Rating (10% weight) - Based on client reviews
      const rating = Number(carWash.rating) || 0;
      const ratingCount = Number(carWash.rating_count) || 0;
      if (rating > 0 && ratingCount > 0) {
        // 5.0 stars => 10 points, scaled linearly
        score += (rating / 5) * 10;
        reasons.push(`Rated ${rating.toFixed(1)}/5 by ${ratingCount} customer${ratingCount > 1 ? 's' : ''}`);
      } else {
        // Fall back to completion history when no ratings exist yet
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('car_wash_id', carWash.id)
          .eq('status', 'completed')
          .limit(100);

        if (bookings && bookings.length > 50) {
          score += 8;
          reasons.push('High completion rate');
        }
      }

      scoredCarWashes.push({
        ...carWash,
        score: Math.round(score * 100) / 100,
        distance: Math.round(distance * 10) / 10,
        reasons
      });
    }

    // Sort by score (descending) and return top recommendations
    return scoredCarWashes
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10

  } catch (error) {
    console.error('Error recommending car washes:', error);
    return [];
  }
}

/**
 * Recommend drivers based on location, ratings, availability, and experience
 */
export async function recommendDrivers(
  userLocation: Location,
  maxDistance: number = 15 // km (drivers can travel further)
): Promise<any[]> {
  try {
    // Fetch all available drivers
    const { data: drivers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('is_active', true)
      .eq('availability', true);

    if (error) throw error;
    if (!drivers) return [];

    // Calculate recommendation scores
    const scoredDrivers: (any & { score: number; distance: number; reasons: string[] })[] = [];

    for (const driver of drivers) {
      let score = 0;
      const reasons: string[] = [];
      let distance = 0;

      // 1. Location Score (30% weight) - Closer is better
      if (driver.location_coordinates) {
        try {
          const coords = typeof driver.location_coordinates === 'string'
            ? JSON.parse(driver.location_coordinates)
            : driver.location_coordinates;
          
          distance = calculateDistance(userLocation, coords);
          
          if (distance <= maxDistance) {
            const locationScore = Math.max(0, 30 * (1 - distance / maxDistance));
            score += locationScore;
            reasons.push(`Nearby (${distance.toFixed(1)}km away)`);
          } else {
            continue; // Skip if too far
          }
        } catch (e) {
          console.error('Error parsing driver coordinates:', e);
        }
      }

      // 2. Rating Score (40% weight) - Higher rating = better
      const rating = driver.driver_rating || 0;
      if (rating > 0) {
        const ratingScore = rating * 8; // 5.0 rating = 40 points
        score += ratingScore;
        reasons.push(`High rating (${rating}/5.0)`);
      }

      // 3. Experience Score (20% weight) - More completed jobs = better
      const completedJobs = driver.completed_jobs || 0;
      if (completedJobs > 0) {
        const experienceScore = Math.min(20, completedJobs / 10); // 200 jobs = 20 points
        score += experienceScore;
        reasons.push(`Experienced (${completedJobs} completed jobs)`);
      }

      // 4. Availability Score (10% weight) - Currently available
      if (driver.availability) {
        score += 10;
        reasons.push('Available now');
      }

      scoredDrivers.push({
        ...driver,
        score: Math.round(score * 100) / 100,
        distance: Math.round(distance * 10) / 10,
        reasons
      });
    }

    // Sort by score (descending) and return top recommendations
    return scoredDrivers
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10

  } catch (error) {
    console.error('Error recommending drivers:', error);
    return [];
  }
}

/**
 * Get nearby car washes within a radius
 */
export async function getNearbyCarWashes(
  userLocation: Location,
  radiusKm: number = 10
): Promise<any[]> {
  try {
    const { data: carWashes, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'carwash')
      .eq('is_active', true);

    if (error) throw error;
    if (!carWashes) return [];

    const nearby: any[] = [];

    for (const carWash of carWashes) {
      if (carWash.location_coordinates) {
        try {
          const coords = typeof carWash.location_coordinates === 'string'
            ? JSON.parse(carWash.location_coordinates)
            : carWash.location_coordinates;
          
          const distance = calculateDistance(userLocation, coords);
          
          if (distance <= radiusKm) {
            nearby.push({
              ...carWash,
              distance: Math.round(distance * 10) / 10
            });
          }
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
      }
    }

    // Sort by distance
    return nearby.sort((a, b) => a.distance - b.distance);

  } catch (error) {
    console.error('Error getting nearby car washes:', error);
    return [];
  }
}

/**
 * Get nearby drivers within a radius
 */
export async function getNearbyDrivers(
  userLocation: Location,
  radiusKm: number = 15
): Promise<any[]> {
  try {
    const { data: drivers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('is_active', true)
      .eq('availability', true);

    if (error) throw error;
    if (!drivers) return [];

    const nearby: any[] = [];

    for (const driver of drivers) {
      if (driver.location_coordinates) {
        try {
          const coords = typeof driver.location_coordinates === 'string'
            ? JSON.parse(driver.location_coordinates)
            : driver.location_coordinates;
          
          const distance = calculateDistance(userLocation, coords);
          
          if (distance <= radiusKm) {
            nearby.push({
              ...driver,
              distance: Math.round(distance * 10) / 10
            });
          }
        } catch (e) {
          console.error('Error parsing driver coordinates:', e);
        }
      }
    }

    // Sort by distance
    return nearby.sort((a, b) => a.distance - b.distance);

  } catch (error) {
    console.error('Error getting nearby drivers:', error);
    return [];
  }
}
