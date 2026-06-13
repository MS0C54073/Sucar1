import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';
import MapView from '../components/MapView';
import { Coordinates } from '../services/locationService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/ToastContainer';
import './BookService.css';

type BookLocationState = { carWashId?: string; serviceId?: string; servicePreset?: string };

const SERVICE_PRESET_MATCH: Record<string, RegExp> = {
  standard: /standard|basic|exterior wash/i,
  deluxe: /deluxe|complete|interior/i,
  detail: /detail|premium/i,
};

const BookService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const preselectApplied = useRef(false);
  const bookState = (location.state as BookLocationState | null) || {};
  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<'pickup_delivery' | 'drive_in' | null>(null);
  const [selectedCarWash, setSelectedCarWash] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | undefined>();
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSetNow = () => {
    const now = new Date();
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    const formatted = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
    setScheduledTime(formatted);
  };

  const { data: carWashes } = useQuery({
    queryKey: ['carwashes'],
    queryFn: async () => {
      const response = await api.get('/carwash/list');
      return response.data.data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ['services', selectedCarWash?.id],
    queryFn: async () => {
      if (!selectedCarWash?.id) return [];
      const response = await api.get(`/carwash/services?carWashId=${selectedCarWash.id}`);
      return response.data.data;
    },
    enabled: !!selectedCarWash,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await api.get('/vehicles');
      return response.data.data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      const response = await api.get('/drivers/available');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (preselectApplied.current || !bookState.carWashId || !carWashes?.length) return;
    const wash = carWashes.find((c: { id: string }) => String(c.id) === String(bookState.carWashId));
    if (!wash) return;
    preselectApplied.current = true;
    setSelectedCarWash(wash);
    setBookingType((prev) => prev || 'drive_in');
    setStep(3);
  }, [carWashes, bookState.carWashId]);

  useEffect(() => {
    if (!bookState.serviceId || !services?.length || !selectedCarWash) return;
    const svc = services.find((s: { id: string }) => String(s.id) === String(bookState.serviceId));
    if (svc) setSelectedService(svc);
  }, [services, bookState.serviceId, selectedCarWash]);

  useEffect(() => {
    if (!bookState.servicePreset || !services?.length || !selectedCarWash) return;
    const pattern = SERVICE_PRESET_MATCH[bookState.servicePreset];
    if (!pattern) return;
    const svc = services.find((s: { name?: string }) => pattern.test(s.name || ''));
    if (svc) setSelectedService(svc);
  }, [services, bookState.servicePreset, selectedCarWash]);

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast('Booking created successfully!', 'success');
      navigate('/client');
    },
    onError: (error: any) => {
      console.error('Booking creation error:', error);

      // Handle validation errors with detailed messages
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('\n');
        showToast(`Validation failed:\n${errorMessages}`, 'error', 6000);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create booking. Please try again.';
        showToast(errorMessage, 'error');
      }
    },
  });

  const handleSubmit = () => {
    if (!selectedCarWash || !selectedService || !selectedVehicle || !bookingType) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (bookingType === 'pickup_delivery' && !pickupLocation) {
      showToast('Please provide pickup location', 'error');
      return;
    }

    // Prepare booking data - only include fields that have values
    const bookingData: any = {
      vehicleId: selectedVehicle.id,
      carWashId: selectedCarWash.id,
      serviceId: selectedService.id,
      bookingType,
    };

    // Only include pickup-related fields for pickup_delivery bookings
    if (bookingType === 'pickup_delivery') {
      if (pickupLocation) {
        bookingData.pickupLocation = pickupLocation;
      }
      if (pickupCoordinates) {
        bookingData.pickupCoordinates = pickupCoordinates;
      }
      if (selectedDriver?.id) {
        bookingData.driverId = selectedDriver.id;
      }
    }

    // Include scheduled time if provided
    if (scheduledTime) {
      bookingData.scheduledPickupTime = scheduledTime;
    }

    createBookingMutation.mutate(bookingData);
  };

  return (
    <div className="book-service sucar-page">
      <header className="book-header">
        <button className="back-button" onClick={() => navigate('/client')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Book Car Wash Service</h1>
          <p className="header-subtitle">Follow the steps to create your booking</p>
        </div>
      </header>

      <div className="book-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Service Type</div>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Select Car Wash</div>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Choose Service</div>
        </div>
        <div className={`step ${step >= 4 ? 'active' : ''} ${step === 4 ? 'current' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Select Vehicle</div>
        </div>
        {bookingType === 'pickup_delivery' && (
          <div className={`step ${step >= 5 ? 'active' : ''} ${step === 5 ? 'current' : ''}`}>
            <div className="step-number">5</div>
            <div className="step-label">Pickup Details</div>
          </div>
        )}
      </div>

      <div className="book-content">
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Choose Service Type</h2>
              <p className="step-description">How would you like to book your car wash?</p>
            </div>
            <div className="booking-type-selection">
              <div
                className={`booking-type-card ${bookingType === 'pickup_delivery' ? 'selected' : ''}`}
                onClick={() => {
                  setBookingType('pickup_delivery');
                  setStep(2);
                }}
              >
                <div className="type-icon">🚗</div>
                <div className="type-content">
                  <h3>Pickup & Delivery</h3>
                  <p>We'll pick up your vehicle and deliver it back to you</p>
                  <ul className="type-features">
                    <li>✓ Driver picks up from your location</li>
                    <li>✓ Vehicle delivered to car wash</li>
                    <li>✓ Clean vehicle returned to you</li>
                  </ul>
                </div>
              </div>
              <div
                className={`booking-type-card ${bookingType === 'drive_in' ? 'selected' : ''}`}
                onClick={() => {
                  setBookingType('drive_in');
                  setStep(2);
                }}
              >
                <div className="type-icon">🏢</div>
                <div className="type-content">
                  <h3>Drive-In Service</h3>
                  <p>Drive to the car wash and wait for your service</p>
                  <ul className="type-features">
                    <li>✓ Drive directly to car wash</li>
                    <li>✓ Real-time queue updates</li>
                    <li>✓ Estimated wait time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
              <h2>Select Car Wash</h2>
              <p className="step-description">Choose a car wash provider near you</p>
            </div>
            {!carWashes || carWashes.length === 0 ? (
              <EmptyState
                icon="🧼"
                title="No car washes available"
                description="Please check back later or contact support"
              />
            ) : (
              <div className="carwash-list">
                {carWashes.map((cw: any) => (
                  <div
                    key={cw.id}
                    className={`carwash-card ${selectedCarWash?.id === cw.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCarWash(cw);
                      setStep(3);
                    }}
                  >
                    {cw.carWashPictureUrl ? (
                      <div className="card-picture">
                        <img 
                          src={cw.carWashPictureUrl} 
                          alt={cw.carWashName || cw.name} 
                          className="card-picture-img"
                        />
                      </div>
                    ) : (
                      <div className="card-icon">🧼</div>
                    )}
                    <div className="card-content">
                      <h3>{cw.carWashName || cw.name}</h3>
                      <p className="card-location">📍 {cw.location}</p>
                      {cw.washingBays && (
                        <p className="card-detail">Washing Bays: {cw.washingBays}</p>
                      )}
                    </div>
                    <div className="card-arrow">→</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
              <h2>Choose Service</h2>
              <p className="step-description">
                Select a service from {selectedCarWash?.carWashName || selectedCarWash?.name}
              </p>
            </div>
            {!services || services.length === 0 ? (
              <EmptyState
                icon="🔧"
                title="No services available"
                description="This car wash hasn't added services yet"
              />
            ) : (
              <div className="services-list">
                {services.map((service: any) => (
                  <div
                    key={service.id}
                    className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(4);
                    }}
                  >
                    <div className="card-icon">✨</div>
                    <div className="card-content">
                      <h3>{service.name}</h3>
                      {service.description && (
                        <p className="card-description">{service.description}</p>
                      )}
                      <p className="price">K{parseFloat(service.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="card-arrow">→</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <div className="step-header">
              <button className="back-btn" onClick={() => setStep(3)}>← Back</button>
              <h2>Select Vehicle</h2>
              <p className="step-description">Choose the vehicle you want to wash</p>
            </div>
            {!vehicles || vehicles.length === 0 ? (
              <EmptyState
                icon="🚗"
                title="No vehicles found"
                description="Add a vehicle to continue with your booking"
                action={{
                  label: "Add Vehicle",
                  onClick: () => navigate('/client/vehicles/add')
                }}
              />
            ) : (
              <div className="vehicles-list">
                {vehicles.map((vehicle: any) => (
                  <div
                    key={vehicle.id}
                    className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      if (bookingType === 'pickup_delivery') {
                        setStep(5);
                      } else {
                        // Drive-in: show confirmation before submitting
                        if (window.confirm(`Confirm booking for ${vehicle.make} ${vehicle.model} at ${selectedCarWash?.carWashName || selectedCarWash?.name}?`)) {
                          handleSubmit();
                        }
                      }
                    }}
                  >
                    <div className="card-icon">🚗</div>
                    <div className="card-content">
                      <h3>{vehicle.make} {vehicle.model}</h3>
                      <p className="card-detail">Plate: {vehicle.plateNo}</p>
                      <p className="card-detail">Color: {vehicle.color}</p>
                    </div>
                    <div className="card-arrow">→</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && bookingType === 'pickup_delivery' && (
          <div className="step-content">
            <div className="step-header">
              <button className="back-btn" onClick={() => setStep(4)}>← Back</button>
              <h2>Pickup Details</h2>
              <p className="step-description">Provide pickup location and preferences</p>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label className="form-label">
                  Pickup Location <span className="required">*</span>
                </label>
                <LocationPicker
                  onLocationSelect={(location, coordinates) => {
                    setPickupLocation(location);
                    setPickupCoordinates(coordinates);
                  }}
                  initialLocation={pickupLocation}
                  initialCoordinates={pickupCoordinates}
                  showMapPreview
                />
                {pickupCoordinates && (
                  <div className="book-service-map-preview">
                    <MapView
                      center={pickupCoordinates}
                      pinLocation={pickupCoordinates}
                      zoom={15}
                      height="200px"
                    />
                  </div>
                )}
                {!pickupLocation && (
                  <p className="form-hint">Search for an address or use your current location — the map updates as you pick a spot</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Pickup Time (Optional)</label>
                <div className="input-with-action">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="form-input"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary now-btn"
                    onClick={handleSetNow}
                  >
                    Now
                  </button>
                </div>
                <p className="form-hint">Leave empty for immediate pickup</p>
              </div>

              <div className="form-group">
                <label className="form-label">Select Driver (Optional)</label>
                <select
                  value={selectedDriver?.id || ''}
                  onChange={(e) => {
                    const driver = drivers?.find((d: any) => d.id === e.target.value);
                    setSelectedDriver(driver || null);
                  }}
                  className="form-select"
                >
                  <option value="">Auto-assign (Recommended)</option>
                  {drivers?.map((driver: any) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.phone}
                    </option>
                  ))}
                </select>
                <p className="form-hint">We'll assign the nearest available driver if not selected</p>
              </div>
            </div>

            <div className="booking-summary">
              <h3 className="summary-title">Booking Summary</h3>
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Car Wash:</span>
                  <span className="summary-value">
                    {selectedCarWash?.carWashName || selectedCarWash?.name}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Service:</span>
                  <span className="summary-value">{selectedService?.name}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Vehicle:</span>
                  <span className="summary-value">
                    {selectedVehicle?.make} {selectedVehicle?.model} - {selectedVehicle?.plateNo}
                  </span>
                </div>
                <div className="summary-row total">
                  <span className="summary-label">Total Amount:</span>
                  <span className="summary-value price">
                    K{parseFloat(selectedService?.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary btn-lg submit-btn"
                onClick={handleSubmit}
                disabled={createBookingMutation.isPending || !pickupLocation}
              >
                {createBookingMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating Booking...</span>
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
              {!pickupLocation && (
                <p className="form-error">Please select a pickup location to continue</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookService;
