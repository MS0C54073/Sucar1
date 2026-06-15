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
import {
  findNearby,
  getLocatableCoordinates,
  formatDistance,
  formatTime,
  formatKwacha,
  parsePrice,
  calculateDistance,
  calculateRouteSegment,
  RouteSegment,
} from '../../services/mappingService';
import { useToast } from '../ToastContainer';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import LocationPicker from '../LocationPicker';
import Icon from '../icons/Icon';
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

interface PendingBookingPreview {
  carWash: CarWashWithDistance;
  service: Service;
  routeSegment: RouteSegment;
  totalPrice: number;
}

interface EnhancedNearbyCarWashesProps {
  onRouteChange?: (segments: RouteSegment[] | null) => void;
  onPendingBookingChange?: (pending: PendingBookingPreview | null) => void;
}

const EnhancedNearbyCarWashes = ({
  onRouteChange,
  onPendingBookingChange,
}: EnhancedNearbyCarWashesProps = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchLocation, setSearchLocation] = useState<Coordinates | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarWash, setSelectedCarWash] = useState<CarWashWithDistance | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<PendingBookingPreview | null>(null);

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
        const list = response.data.data || [];
        return list.map((s: Service) => ({ ...s, price: parsePrice(s.price) }));
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
        setSearchLocation(coords);
        setPickupAddress('Current location');
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

    const nearby = findNearby(filteredCarWashes, searchLocation, 50);

    return nearby
      .map((carWash) => {
        const coords = getLocatableCoordinates(carWash as Record<string, unknown>);
        if (!coords) return null;

        const distance = calculateDistance(searchLocation, coords);
        if (!Number.isFinite(distance)) return null;

        const routeSegment = calculateRouteSegment(searchLocation, coords);
        const services = (carWash.services || []).map((s) => ({
          ...s,
          price: parsePrice(s.price),
        }));

        return {
          ...carWash,
          services,
          distance,
          routeSegment,
          estimatedTime: routeSegment.estimatedTime,
        } as CarWashWithDistance;
      })
      .filter((cw): cw is CarWashWithDistance => cw !== null)
      .sort((a, b) => a.distance - b.distance);
  }, [filteredCarWashes, searchLocation]);

  const calculateTotalPrice = (servicePrice: unknown, distance: number): number => {
    const base = parsePrice(servicePrice);
    const km = Number.isFinite(distance) ? distance : 0;
    return Math.round((base + km * 5) * 100) / 100;
  };

  const formatCoordsLabel = (coords: Coordinates | null) => {
    if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
      return '';
    }
    return `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`;
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
    if (!Number.isFinite(coordinates?.lat) || !Number.isFinite(coordinates?.lng)) {
      showToast('Invalid location coordinates. Please pick another result.', 'error');
      return;
    }
    setPickupAddress(location);
    setSearchLocation(coordinates);
    setShowAutocomplete(false);
    setPendingBooking(null);
  };

  const resolveRouteForWash = (
    carWash: CarWash | CarWashWithDistance,
  ): RouteSegment | null => {
    if (carWash.routeSegment) return carWash.routeSegment;
    if (!searchLocation) return null;
    const coords = getLocatableCoordinates(carWash as Record<string, unknown>);
    if (!coords) return null;
    return calculateRouteSegment(searchLocation, coords);
  };

  const enrichCarWashWithDistance = (carWash: CarWash): CarWashWithDistance => {
    if (!searchLocation) {
      return { ...carWash, distance: 0 };
    }
    const coords = getLocatableCoordinates(carWash as Record<string, unknown>);
    if (!coords) {
      return { ...carWash, distance: 0 };
    }
    const distance = calculateDistance(searchLocation, coords);
    const routeSegment = calculateRouteSegment(searchLocation, coords);
    return {
      ...carWash,
      distance: Number.isFinite(distance) ? distance : 0,
      routeSegment,
      estimatedTime: routeSegment.estimatedTime,
    };
  };

  const handleCarWashSelect = (carWash: CarWash | CarWashWithDistance) => {
    setSelectedCarWash(enrichCarWashWithDistance(carWash));
    setShowBookingModal(true);
  };

  const handleBookNow = (carWash: CarWashWithDistance, service: Service) => {
    if (!searchLocation) {
      showToast('Please select a pickup location first', 'error');
      return;
    }

    const routeSegment = resolveRouteForWash(carWash);
    if (!routeSegment) {
      showToast(
        'This car wash has no map location saved. Pick another one or ask the operator to update their address.',
        'error',
      );
      return;
    }

    const distance = routeSegment.distance;
    const enrichedWash: CarWashWithDistance = {
      ...carWash,
      distance: carWash.distance ?? distance,
      routeSegment,
      estimatedTime: routeSegment.estimatedTime,
    };

    const totalPrice = calculateTotalPrice(service.price, distance);

    const pending = {
      carWash: enrichedWash,
      service,
      routeSegment,
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

  const submitBooking = (
    carWash: CarWashWithDistance,
    service: Service,
    vehicle: { id: string },
  ) => {
    if (!searchLocation) {
      showToast('Please select a pickup location first', 'error');
      return;
    }
    createBookingMutation.mutate({
      vehicleId: vehicle.id,
      carWashId: carWash.id,
      serviceId: service.id,
      bookingType: 'pickup_delivery',
      pickupLocation:
        pickupAddress ||
        carWash.location ||
        `Near ${carWash.carWashName || carWash.name || 'car wash'}`,
      pickupCoordinates: searchLocation,
    });
  };

  const handleConfirmModalBooking = () => {
    if (!selectedCarWash || !selectedService || !selectedVehicle) {
      showToast('Please select a service and vehicle', 'error');
      return;
    }
    const routeSegment = resolveRouteForWash(selectedCarWash);
    if (!routeSegment) {
      showToast(
        'This car wash has no map location saved. Pick another one or ask the operator to update their address.',
        'error',
      );
      return;
    }
    submitBooking(
      { ...selectedCarWash, routeSegment, distance: selectedCarWash.distance ?? routeSegment.distance },
      selectedService,
      selectedVehicle,
    );
  };

  const handleAcceptBooking = () => {
    if (!pendingBooking || !selectedVehicle) {
      showToast('Please select a vehicle first', 'error');
      setShowBookingModal(true);
      return;
    }

    submitBooking(pendingBooking.carWash, pendingBooking.service, selectedVehicle);

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
          <span className="search-icon"><Icon name="search" size={17} /></span>
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteResults.length > 0 && (
            <div className="autocomplete-dropdown">
              {autocompleteResults.map((carWash) => (
                <div
                  key={carWash.id}
                  className="autocomplete-item"
                  onClick={() => {
                    const name = carWash.carWashName || carWash.name || '';
                    setSearchQuery(name);
                    setShowAutocomplete(false);
                    searchInputRef.current?.blur();
                    if (searchLocation) {
                      handleCarWashSelect(carWash);
                    }
                  }}
                >
                  <span className="autocomplete-icon"><Icon name="droplets" size={16} /></span>
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
            initialLocation={formatCoordsLabel(searchLocation)}
            initialCoordinates={searchLocation || undefined}
            showMapPreview
          />
          {locationError && (
            <p className="location-error">{locationError}</p>
          )}
        </div>
      </div>

      {/* Results */}
      {!searchLocation ? (
        <div className="no-location-message">
          <p><Icon name="mapPin" size={15} /> Please select a location to see nearby car washes</p>
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
                    <div className="carwash-icon"><Icon name="droplets" size={20} /></div>
                  )}
                  <div className="carwash-info">
                    <h4 className="carwash-name">
                      {carWash.carWashName || carWash.name || 'Car Wash'}
                    </h4>
                    <p className="carwash-location">
                      <Icon name="mapPin" size={13} /> {carWash.location || 'Location not specified'}
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
                      const totalPrice = calculateTotalPrice(service.price, carWash.distance ?? 0);
                      return (
                        <div key={service.id} className="service-item">
                          <div className="service-info">
                            <span className="service-name">{service.name}</span>
                            <span className="service-price">
                              K{formatKwacha(service.price)}
                            </span>
                          </div>
                          <div className="service-total">
                            <span className="total-label">Total (with delivery):</span>
                            <span className="total-price">K{formatKwacha(totalPrice)}</span>
                            <span className="distance-fee">
                              (+K{formatKwacha((carWash.distance ?? 0) * 5)} delivery fee)
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
                  <Icon name="mapPin" size={13} /> {formatDistance(selectedCarWash.distance)} away
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
                            <span className="service-option-price">K{formatKwacha(service.price)}</span>
                          </div>
                          {service.description && (
                            <p className="service-option-desc">{service.description}</p>
                          )}
                          <div className="service-option-total">
                            <span>Total: K{formatKwacha(totalPrice)}</span>
                            <span className="service-option-fee">
                              (Service: K{formatKwacha(service.price)} + Delivery: K{formatKwacha((selectedCarWash.distance ?? 0) * 5)})
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
                    <span>K{formatKwacha(selectedService.price)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>K{formatKwacha((selectedCarWash.distance ?? 0) * 5)}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total:</span>
                    <span className="total-amount">
                      K{formatKwacha(calculateTotalPrice(selectedService.price, selectedCarWash.distance ?? 0))}
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
                onClick={handleConfirmModalBooking}
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
            <h4><Icon name="clipboard" size={16} /> Booking Summary</h4>
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
                  K{formatKwacha(pendingBooking.service.price)}
                </span>
              </div>
              <div className="pending-info-row">
                <span className="pending-label">Delivery Fee:</span>
                <span className="pending-value">
                  K{formatKwacha((pendingBooking.routeSegment?.distance ?? 0) * 5)}
                </span>
              </div>
              <div className="pending-info-row total-pending-row">
                <span className="pending-label">Total Price:</span>
                <span className="pending-total-price">
                  K{formatKwacha(pendingBooking.totalPrice)}
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
