/**
 * Enhanced NearbyCarWashes Component
 * 
 * Features:
 * - Live location search
 * - Distance calculation
 * - Price display with distance-based fees
 * - Search bar with autocomplete
 * - Quick booking from results
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCurrentPosition, Coordinates } from '../../services/locationService';
import { findNearby, parseCoordinates, formatDistance, formatTime, calculateDistance, calculateRouteSegment, RouteSegment } from '../../services/mappingService';
import { useToast } from '../ToastContainer';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import LocationPicker from '../LocationPicker';
import './EnhancedNearbyCarWashes.css';

interface CarWash {
  id: string;
  name?: string;
  carWashName?: string;
  location?: string;
  locationCoordinates?: Coordinates | string;
  services?: Service[];
  carWashPictureUrl?: string;
  profilePictureUrl?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
}

interface CarWashWithDistance extends CarWash {
  distance: number;
  totalPrice?: number;
  routeSegment?: RouteSegment;
  estimatedTime?: number;
}

const EnhancedNearbyCarWashes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchLocation, setSearchLocation] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarWash, setSelectedCarWash] = useState<CarWashWithDistance | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    carWash: CarWashWithDistance;
    service: Service;
    routeSegment: RouteSegment;
    totalPrice: number;
  } | null>(null);

  // Fetch car washes with services
  const { data: carWashes, isLoading: carWashesLoading } = useQuery<CarWash[]>({
    queryKey: ['carwashes-nearby'],
    queryFn: async () => {
      try {
        const response = await api.get('/carwash/list?includeServices=true');
        const carWashesData = response.data.data || [];
        
        // Fetch services for each car wash if not included
        const carWashesWithServices = await Promise.all(
          carWashesData.map(async (cw: CarWash) => {
            if (cw.services && cw.services.length > 0) {
              return cw;
            }
            try {
              const servicesResponse = await api.get(`/carwash/services?carWashId=${cw.id}`);
              return {
                ...cw,
                services: servicesResponse.data.data || [],
              };
            } catch (error) {
              console.error(`Error fetching services for car wash ${cw.id}:`, error);
              return { ...cw, services: [] };
            }
          })
        );
        
        return carWashesWithServices;
      } catch (error) {
        console.error('Error fetching car washes:', error);
        return [];
      }
    },
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false, // Disable automatic refetching
  });

  // Fetch services for selected car wash
  const { data: services } = useQuery<Service[]>({
    queryKey: ['services', selectedCarWash?.id],
    queryFn: async () => {
      if (!selectedCarWash?.id) return [];
      try {
        const response = await api.get(`/carwash/services?carWashId=${selectedCarWash.id}`);
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    },
    enabled: !!selectedCarWash?.id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch user vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        const response = await api.get('/vehicles');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Get user's current location
  useEffect(() => {
    getCurrentPosition()
      .then((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setSearchLocation(coords); // Default to user location
        setLocationError(null);
      })
      .catch((error) => {
        console.warn('Location error:', error);
        setLocationError('Could not get your location. Please search for a location.');
      });
  }, []);

  // Filter car washes by search query
  const filteredCarWashes = useMemo(() => {
    if (!carWashes) return [];
    
    if (!searchQuery.trim()) {
      return carWashes;
    }

    const query = searchQuery.toLowerCase();
    return carWashes.filter((cw) => {
      const name = (cw.carWashName || cw.name || '').toLowerCase();
      const location = (cw.location || '').toLowerCase();
      return name.includes(query) || location.includes(query);
    });
  }, [carWashes, searchQuery]);

  // Find nearby car washes based on search location
  const nearbyCarWashes = useMemo(() => {
    if (!filteredCarWashes || !searchLocation) return [];
    
    const nearby = findNearby(filteredCarWashes, searchLocation, 50); // 50km radius
    
    // Calculate distance, route segment, and estimated time for each car wash
    return nearby.map((carWash) => {
      const coords = parseCoordinates(carWash.locationCoordinates);
      if (!coords) {
        return { ...carWash, distance: Infinity };
      }
      
      const distance = calculateDistance(searchLocation, coords);
      const routeSegment = calculateRouteSegment(searchLocation, coords);
      
      return { 
        ...carWash, 
        distance,
        routeSegment,
        estimatedTime: routeSegment.estimatedTime,
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [filteredCarWashes, searchLocation]);

  // Calculate price with distance-based fee
  const calculateTotalPrice = (servicePrice: number, distance: number): number => {
    // Base service price
    let total = servicePrice;
    
    // Distance-based fee: K5 per km for pickup & delivery
    const distanceFee = distance * 5;
    total += distanceFee;
    
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  };

  // Booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      showToast('Booking created successfully!', 'success');
      setShowBookingModal(false);
      setSelectedCarWash(null);
      setSelectedService(null);
      setSelectedVehicle(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create booking';
      showToast(errorMessage, 'error');
    },
  });

  const handleLocationSelect = (location: string, coordinates: Coordinates) => {
    setSearchLocation(coordinates);
    setShowAutocomplete(false);
    // Clear pending booking when location changes
    setPendingBooking(null);
  };

  const handleCarWashSelect = (carWash: CarWashWithDistance) => {
    setSelectedCarWash(carWash);
    setShowBookingModal(true);
  };

  const handleBookNow = (carWash: CarWashWithDistance, service: Service) => {
    if (!searchLocation) {
      showToast('Please select a pickup location', 'error');
      return;
    }

    if (!carWash.routeSegment) {
      showToast('Unable to calculate route. Please try again.', 'error');
      return;
    }

    const totalPrice = calculateTotalPrice(service.price, carWash.distance);
    
    // Set pending booking to show route and accept/reject prompt
    const pending = {
      carWash,
      service,
      routeSegment: carWash.routeSegment,
      totalPrice,
    };
    setPendingBooking(pending);
    
    // Notify parent component about route change
    if (onRouteChange) {
      onRouteChange([carWash.routeSegment]);
    }
    if (onPendingBookingChange) {
      onPendingBookingChange(pending);
    }
  };

  const handleAcceptBooking = () => {
    if (!pendingBooking || !selectedVehicle) {
      showToast('Please select a vehicle first', 'error');
      setShowBookingModal(true);
      return;
    }

    createBookingMutation.mutate({
      vehicleId: selectedVehicle.id,
      carWashId: pendingBooking.carWash.id,
      serviceId: pendingBooking.service.id,
      bookingType: 'pickup_delivery',
      pickupLocation: `Near ${pendingBooking.carWash.carWashName || pendingBooking.carWash.name}`,
      pickupCoordinates: searchLocation,
    });

    setPendingBooking(null);
    if (onRouteChange) {
      onRouteChange(null);
    }
    if (onPendingBookingChange) {
      onPendingBookingChange(null);
    }
  };

  const handleRejectBooking = () => {
    setPendingBooking(null);
    if (onRouteChange) {
      onRouteChange(null);
    }
    if (onPendingBookingChange) {
      onPendingBookingChange(null);
    }
  };

  const autocompleteResults = useMemo(() => {
    if (!searchQuery.trim() || !carWashes) return [];
    
    const query = searchQuery.toLowerCase();
    return carWashes
      .filter((cw) => {
        const name = (cw.carWashName || cw.name || '').toLowerCase();
        const location = (cw.location || '').toLowerCase();
        return name.includes(query) || location.includes(query);
      })
      .slice(0, 5); // Limit to 5 results
  }, [searchQuery, carWashes]);

  if (carWashesLoading) {
    return (
      <div className="enhanced-nearby-carwashes">
        <div className="enhanced-header">
          <h3>Bookings & Nearby Services</h3>
        </div>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="enhanced-nearby-carwashes">
      <div className="map-tooltip-enhanced" aria-live="polite">
        {hoveredIcon && hoveredIcon.name && <span>{hoveredIcon.name}</span>}
      </div>
      <div className="enhanced-header">
        <h3>Bookings & Nearby Services</h3>
        <p className="enhanced-subtitle">Search and book car wash services near you</p>
      </div>

      {/* Search Bar with Autocomplete */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search car washes by name or location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAutocomplete(true);
            }}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => {
              // Delay to allow click on autocomplete items
              setTimeout(() => setShowAutocomplete(false), 200);
            }}
          />
          <span className="search-icon">🔍</span>
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteResults.length > 0 && (
            <div className="autocomplete-dropdown">
              {autocompleteResults.map((carWash) => (
                <div
                  key={carWash.id}
                  className="autocomplete-item"
                  onClick={() => {
                    setSearchQuery(carWash.carWashName || carWash.name || '');
                    setShowAutocomplete(false);
                    searchInputRef.current?.blur();
                    handleCarWashSelect(carWash); // Open profile modal on click
                  }}
                >
                  <span className="autocomplete-icon">🧼</span>
                  <div className="autocomplete-content">
                    <div className="autocomplete-name">
                      {carWash.carWashName || carWash.name || 'Car Wash'}
                    </div>
                    <div className="autocomplete-location">
                      {carWash.location || 'Location not specified'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Picker */}
        <div className="location-picker-section">
          <label className="location-label">Pickup Location</label>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={searchLocation ? `Lat: ${searchLocation.lat.toFixed(4)}, Lng: ${searchLocation.lng.toFixed(4)}` : ''}
            initialCoordinates={searchLocation || undefined}
          />
          {locationError && (
            <p className="location-error">{locationError}</p>
          )}
        </div>
      </div>

      {/* Results */}
      {!searchLocation ? (
        <div className="no-location-message">
          <p>📍 Please select a location to see nearby car washes</p>
        </div>
      ) : nearbyCarWashes.length === 0 ? (
        <div className="no-results">
          <p>No car washes found nearby</p>
          <p className="no-results-hint">Try adjusting your search or location</p>
        </div>
      ) : (
        <div className="carwashes-results">
          <div className="results-header">
            <span className="results-count">{nearbyCarWashes.length} car washes found</span>
            <span className="results-sort">Sorted by distance</span>
          </div>
          
          <div className="carwashes-list">
            {nearbyCarWashes.map((carWash) => (
              <div 
                key={carWash.id} 
                className="carwash-card"
                style={(carWash.carWashName || '').toLowerCase() === 'crystal clean car wash' ? { boxShadow: '0 0 12px 3px #0ea5e9' } : undefined}
              >
                <div className="carwash-card-header">
                  {carWash.carWashPictureUrl ? (
                    <div className="carwash-picture">
                      <img 
                        src={carWash.carWashPictureUrl} 
                        alt={carWash.carWashName || carWash.name || 'Car Wash'} 
                        className="carwash-picture-img"
                      />
                    </div>
                  ) : (
                    <div className="carwash-icon">🧼</div>
                  )}
                  <div className="carwash-info">
                    <h4 className="carwash-name">
                      {carWash.carWashName || carWash.name || 'Car Wash'}
                    </h4>
                    <p className="carwash-location">
                      📍 {carWash.location || 'Location not specified'}
                    </p>
                    <p className="carwash-distance">
                      {formatDistance(carWash.distance)} away
                    </p>
                  </div>
                </div>

                {carWash.services && carWash.services.length > 0 && (
                  <div className="carwash-services">
                    <div className="services-header">Available Services:</div>
                    {carWash.services.slice(0, 3).map((service) => {
                      const totalPrice = calculateTotalPrice(service.price, carWash.distance);
                      return (
                        <div key={service.id} className="service-item">
                          <div className="service-info">
                            <span className="service-name">{service.name}</span>
                            <span className="service-price">
                              K{service.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="service-total">
                            <span className="total-label">Total (with delivery):</span>
                            <span className="total-price">K{totalPrice.toFixed(2)}</span>
                            <span className="distance-fee">
                              (+K{(carWash.distance * 5).toFixed(2)} delivery fee)
                            </span>
                          </div>
                          <button
                            className="book-now-btn"
                            onClick={() => handleBookNow(carWash, service)}
                          >
                            Book Now
                          </button>
                        </div>
                      );
                    })}
                    {carWash.services.length > 3 && (
                      <button
                        className="view-all-services-btn"
                        onClick={() => handleCarWashSelect(carWash)}
                      >
                        View All {carWash.services.length} Services
                      </button>
                    )}
                  </div>
                )}

                {(!carWash.services || carWash.services.length === 0) && (
                  <button
                    className="view-details-btn"
                    onClick={() => handleCarWashSelect(carWash)}
                  >
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedCarWash && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Your Booking</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowBookingModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* Car Wash Info */}
              <div className="modal-section">
                <h4>Car Wash</h4>
                <p className="modal-carwash-name">
                  {selectedCarWash.carWashName || selectedCarWash.name}
                </p>
                <p className="modal-distance">
                  📍 {formatDistance(selectedCarWash.distance)} away
                </p>
              </div>

              {/* Service Selection */}
              <div className="modal-section">
                <h4>Select Service</h4>
                {services && services.length > 0 ? (
                  <div className="services-select">
                    {services.map((service) => {
                      const totalPrice = calculateTotalPrice(service.price, selectedCarWash.distance);
                      return (
                        <div
                          key={service.id}
                          className={`service-option ${selectedService?.id === service.id ? 'selected' : ''}`}
                          onClick={() => setSelectedService(service)}
                        >
                          <div className="service-option-header">
                            <span className="service-option-name">{service.name}</span>
                            <span className="service-option-price">K{service.price.toFixed(2)}</span>
                          </div>
                          {service.description && (
                            <p className="service-option-desc">{service.description}</p>
                          )}
                          <div className="service-option-total">
                            <span>Total: K{totalPrice.toFixed(2)}</span>
                            <span className="service-option-fee">
                              (Service: K{service.price.toFixed(2)} + Delivery: K{(selectedCarWash.distance * 5).toFixed(2)})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>No services available</p>
                )}
              </div>

              {/* Vehicle Selection */}
              <div className="modal-section">
                <h4>Select Vehicle</h4>
                {vehicles && vehicles.length > 0 ? (
                  <div className="vehicles-select">
                    {vehicles.map((vehicle: any) => (
                      <div
                        key={vehicle.id}
                        className={`vehicle-option ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <span className="vehicle-option-name">
                          {vehicle.make} {vehicle.model}
                        </span>
                        <span className="vehicle-option-plate">{vehicle.plateNo}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-vehicles">
                    <p>No vehicles found</p>
                    <button
                      className="add-vehicle-btn"
                      onClick={() => {
                        setShowBookingModal(false);
                        navigate('/client/vehicles/add');
                      }}
                    >
                      Add Vehicle
                    </button>
                  </div>
                )}
              </div>

              {/* Booking Summary */}
              {selectedService && selectedVehicle && (
                <div className="modal-section booking-summary">
                  <h4>Booking Summary</h4>
                  <div className="summary-row">
                    <span>Service:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>Vehicle:</span>
                    <span>{selectedVehicle.make} {selectedVehicle.model}</span>
                  </div>
                  <div className="summary-row">
                    <span>Distance:</span>
                    <span>{formatDistance(selectedCarWash.distance)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Service Price:</span>
                    <span>K{selectedService.price.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>K{(selectedCarWash.distance * 5).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total:</span>
                    <span className="total-amount">
                      K{calculateTotalPrice(selectedService.price, selectedCarWash.distance).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-confirm-btn"
                onClick={handleBookNow}
                disabled={
                  !selectedService ||
                  !selectedVehicle ||
                  !searchLocation ||
                  createBookingMutation.isPending
                }
              >
                {createBookingMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Booking Prompt - Shows route, price, time, and accept/reject */}
      {pendingBooking && searchLocation && (
        <div className="pending-booking-prompt">
          <div className="pending-booking-header">
            <h4>📋 Booking Summary</h4>
            <button
              className="close-pending-btn"
              onClick={handleRejectBooking}
              title="Close"
            >
              ×
            </button>
          </div>
          
          <div className="pending-booking-content">
            <div className="pending-booking-info">
              <div className="pending-info-row">
                <span className="pending-label">Car Wash:</span>
                <span className="pending-value">
                  {pendingBooking.carWash.carWashName || pendingBooking.carWash.name}
                </span>
              </div>
              <div className="pending-info-row">
                <span className="pending-label">Service:</span>
                <span className="pending-value">{pendingBooking.service.name}</span>
              </div>
              <div className="pending-info-row">
                <span className="pending-label">Distance:</span>
                <span className="pending-value">
                  {formatDistance(pendingBooking.routeSegment.distance)}
                </span>
              </div>
              <div className="pending-info-row">
                <span className="pending-label">Estimated Time:</span>
                <span className="pending-value">
                  {formatTime(pendingBooking.routeSegment.estimatedTime)}
                </span>
              </div>
              <div className="pending-info-row">
                <span className="pending-label">Service Price:</span>
                <span className="pending-value">
                  K{pendingBooking.service.price.toFixed(2)}
                </span>
              </div>
              <div className="pending-info-row">
                <span className="pending-label">Delivery Fee:</span>
                <span className="pending-value">
                  K{(pendingBooking.routeSegment.distance * 5).toFixed(2)}
                </span>
              </div>
              <div className="pending-info-row total-pending-row">
                <span className="pending-label">Total Price:</span>
                <span className="pending-total-price">
                  K{pendingBooking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pending-booking-actions">
              <button
                className="reject-booking-btn"
                onClick={handleRejectBooking}
              >
                Cancel
              </button>
              <button
                className="accept-booking-btn"
                onClick={() => {
                  if (!selectedVehicle) {
                    setSelectedCarWash(pendingBooking.carWash);
                    setSelectedService(pendingBooking.service);
                    setShowBookingModal(true);
                  } else {
                    handleAcceptBooking();
                  }
                }}
              >
                {selectedVehicle ? 'Accept & Book' : 'Select Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNearbyCarWashes;
