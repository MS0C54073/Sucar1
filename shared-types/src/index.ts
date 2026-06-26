/**
 * SuCAR Shared Types
 *
 * Single source of truth for type definitions shared across backend, web, and mobile.
 * All IDs use UUID format (Supabase/PostgreSQL).
 */

// Re-export the centralized booking state machine
export * from './booking-state-machine';

// ─── User Types ──────────────────────────────────────────────────────────────

export type UserRole = 'client' | 'driver' | 'carwash' | 'admin' | 'subadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  nrc: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Client specific
  businessName?: string;
  isBusiness?: boolean;

  // Driver specific
  licenseNo?: string;
  licenseType?: string;
  licenseExpiry?: string;
  address?: string;
  maritalStatus?: string;
  availability?: boolean;

  // Car Wash specific
  carWashName?: string;
  location?: string;
  washingBays?: number;

  /** @deprecated Use `id` instead. Kept for backward compatibility. */
  _id?: string;
}

// ─── Vehicle Types ───────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  clientId: string;
  make: string;
  model: string;
  plateNo: string;
  color: string;
  createdAt: string;
  updatedAt: string;

  /** @deprecated Use `id` instead. */
  _id?: string;
}

// ─── Service Types ───────────────────────────────────────────────────────────

export type ServiceName =
  | 'Full Basic Wash'
  | 'Engine Wash'
  | 'Exterior Wash'
  | 'Interior Wash'
  | 'Wax and Polishing'
  | string; // Allow custom service names

export interface Service {
  id: string;
  carWashId: string;
  name: ServiceName;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  /** @deprecated Use `id` instead. */
  _id?: string;
}

// ─── Booking Types ───────────────────────────────────────────────────────────

// BookingStatus and BookingType are re-exported from booking-state-machine.ts
import type { BookingStatus, BookingType } from './booking-state-machine';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'pending';

export interface Booking {
  id: string;
  clientId: string;
  driverId?: string;
  carWashId: string;
  vehicleId: string;
  serviceId: string;
  bookingType: BookingType;
  pickupLocation?: string;
  pickupCoordinates?: {
    lat: number;
    lng: number;
  };
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  scheduledPickupTime?: string;
  actualPickupTime?: string;
  washStartTime?: string;
  washCompleteTime?: string;
  deliveryTime?: string;
  notes?: string;

  // Workflow flags
  washAcceptancePending?: boolean;
  clientConfirmPending?: boolean;
  returnInProgress?: boolean;
  outForDelivery?: boolean;

  // Queue fields (drive-in)
  queuePosition?: number;
  estimatedWaitTime?: number;

  createdAt: string;
  updatedAt: string;

  // Populated fields (when fetched with relations)
  client?: User;
  driver?: User;
  carWash?: User;
  vehicle?: Vehicle;
  service?: Service;

  /** @deprecated Use `id` instead. */
  _id?: string;
}

// ─── Payment Types ───────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;

  /** @deprecated Use `id` instead. */
  _id?: string;
}

// ─── Car Wash Types ──────────────────────────────────────────────────────────

export interface CarWash {
  id: string;
  name: string;
  carWashName: string;
  location: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  washingBays: number;
  email: string;
  phone: string;
  services?: Service[];

  /** @deprecated Use `id` instead. */
  _id?: string;
}

// ─── Dashboard Stats Types ───────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalBookings: number;
  pendingPickups: number;
  completedWashes: number;
  totalRevenue: number;
  totalClients: number;
  totalDrivers: number;
  totalCarWashes: number;
}

export interface CarWashDashboardStats {
  totalBookings: number;
  pendingBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  count?: number;
}

// ─── Registration Types ──────────────────────────────────────────────────────

export interface ClientRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  nrc: string;
  role: 'client';
  businessName?: string;
  isBusiness?: boolean;
}

export interface DriverRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  nrc: string;
  role: 'driver';
  licenseNo: string;
  licenseType: string;
  licenseExpiry: string;
  address: string;
  maritalStatus: string;
}

export interface CarWashRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  nrc: string;
  role: 'carwash';
  carWashName: string;
  location: string;
  washingBays: number;
}

export type RegistrationData =
  | ClientRegistrationData
  | DriverRegistrationData
  | CarWashRegistrationData;

// ─── Notification Types ──────────────────────────────────────────────────────

export type NotificationType = 'booking_update' | 'payment' | 'system' | 'chat';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
}

// ─── Booking Status Log ──────────────────────────────────────────────────────

export interface BookingStatusLog {
  id: string;
  bookingId: string;
  actorId: string;
  actorRole: UserRole;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  note?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ─── Location Tracking ───────────────────────────────────────────────────────

export interface LocationUpdate {
  id: string;
  bookingId: string;
  userId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  createdAt: string;
}
