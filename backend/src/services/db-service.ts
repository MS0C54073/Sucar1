import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';

// Helper to convert Supabase row to camelCase
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const camelObj: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
    return camelObj;
  }
  return obj;
};

// Helper to convert camelCase to snake_case for database
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const snakeObj: any = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = toSnakeCase(obj[key]);
    }
    return snakeObj;
  }
  return obj;
};

export class DBService {
  // User operations
  static async findUserByEmail(email: string) {
    // Normalize email for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Try exact match first (most common case)
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      // If not found with exact match, try lowercase
      if (!data && (error?.code === 'PGRST116' || !error)) {
        const { data: data2, error: error2 } = await supabase
          .from('users')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (data2) {
          data = data2;
          error = error2;
        }
      }

      // If still not found, do a case-insensitive search by fetching all and filtering
      if (!data) {
        console.log(`Exact match failed, trying case-insensitive search for: ${email}`);

        const { data: allUsers, error: allError } = await supabase
          .from('users')
          .select('*')
          .limit(1000);

        if (allError) {
          console.error('Error fetching users for case-insensitive search:', allError);
          // Don't throw, just return null
        } else if (allUsers && allUsers.length > 0) {
          // Find user with case-insensitive email match
          const user = allUsers.find((u: any) =>
            u.email && u.email.toLowerCase().trim() === normalizedEmail
          );

          if (user) {
            console.log(`✅ Found user with case-insensitive match: ${user.email}`);
            return toCamelCase(user);
          }
        }
      }

      // Handle errors (except "not found" which is expected)
      if (error && error.code !== 'PGRST116') {
        console.error('Error finding user by email:', error);
        throw error;
      }

      // Return data if found, null otherwise
      return data ? toCamelCase(data) : null;
    } catch (error: any) {
      console.error('Exception in findUserByEmail:', error);
      throw error;
    }
  }

  static async findUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async findUserByNrc(nrc: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nrc', nrc)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  }

  static async findUserByGoogleId(googleId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  }

  static async findUserByPhone(phone: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  }

  static async createUser(userData: any) {
    let hashedPassword = null;

    // Hash password only if provided (not for OAuth/phone auth)
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    // Convert to snake_case
    const snakeCaseData = toSnakeCase(userData);
    
    // Set auth_provider default if not provided
    if (!snakeCaseData.auth_provider) {
      snakeCaseData.auth_provider = 'local';
    }

    const dataToInsert: any = {
      ...snakeCaseData,
      is_active: true, // Ensure user is active by default
    };

    // Only set password if it exists (for OAuth/phone users, password is null)
    if (hashedPassword !== null) {
      dataToInsert.password = hashedPassword;
    } else if (snakeCaseData.password === undefined && snakeCaseData.auth_provider !== 'local') {
      // For OAuth/phone auth, explicitly set password to null
      dataToInsert.password = null;
    }

    // Ensure required fields have defaults for OAuth/phone users
    if (!dataToInsert.email && dataToInsert.auth_provider === 'phone') {
      dataToInsert.email = `${dataToInsert.phone}@sucar.placeholder`;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    return toCamelCase(data);
  }

  static async updateUserGoogleId(userId: string, googleId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ google_id: googleId, auth_provider: 'google' })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async storePhoneVerificationCode(phone: string, code: string, expiresInMinutes: number = 10) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // First, try to update existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      const { error } = await supabase
        .from('users')
        .update({
          phone_verification_code: code,
          phone_verification_expires: expiresAt.toISOString(),
        })
        .eq('id', existingUser.id);

      if (error) throw error;
      return true;
    }

    // If no user exists, we'll store it when they verify (in verifyOTP)
    return true;
  }

  static async verifyPhoneCode(phone: string, code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('phone_verification_code, phone_verification_expires')
      .eq('phone', phone)
      .maybeSingle();

    if (error || !data) return false;

    // Check if code matches and hasn't expired
    if (data.phone_verification_code === code) {
      const expiresAt = new Date(data.phone_verification_expires);
      if (expiresAt > new Date()) {
        // Clear the code after verification
        await supabase
          .from('users')
          .update({
            phone_verified: true,
            phone_verification_code: null,
            phone_verification_expires: null,
          })
          .eq('phone', phone);
        return true;
      }
    }

    return false;
  }

  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Vehicle operations
  static async getVehiclesByClient(clientId: string) {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error in getVehiclesByClient:', error);
      console.error('   Client ID:', clientId);
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    // Ensure data is an array
    const rawData = data || [];
    if (!Array.isArray(rawData)) {
      console.warn('⚠️ getVehiclesByClient returned non-array data:', rawData);
      return [];
    }

    return toCamelCase(rawData);
  }

  static async getVehicleById(id: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async createVehicle(vehicleData: any) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(toSnakeCase(vehicleData))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async updateVehicle(id: string, vehicleData: any) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(toSnakeCase(vehicleData))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async deleteVehicle(id: string) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Service operations
  static async getServicesByCarWash(carWashId: string, includeInactive: boolean = false) {
    let query = supabase
      .from('services')
      .select('*')
      .eq('car_wash_id', carWashId);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return toCamelCase(data || []);
  }

  static async getServiceById(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async createService(serviceData: any) {
    // Ensure name is properly trimmed and validated
    const name = serviceData.name?.trim();

    if (!name || name.length === 0) {
      throw new Error('Service name cannot be empty');
    }

    if (name.length > 100) {
      throw new Error('Service name cannot exceed 100 characters');
    }

    const cleanedData = {
      ...toSnakeCase(serviceData),
      name: name,
    };

    const { data, error } = await supabase
      .from('services')
      .insert(cleanedData)
      .select()
      .single();

    if (error) {
      // Provide more helpful error message for constraint violations
      if (error.code === '23514' ||
        error.message?.includes('check constraint') ||
        error.message?.includes('services_name_check') ||
        error.message?.includes('name IN') ||
        error.message?.includes('constraint')) {
        const errorMsg = `⚠️ DATABASE CONSTRAINT ERROR ⚠️\n\n` +
          `The services table has a restrictive constraint.\n\n` +
          `TO FIX:\n` +
          `1. Open Supabase Dashboard → SQL Editor\n` +
          `2. Copy ALL contents of RUN_THIS_NOW.sql (in project root)\n` +
          `3. Paste and click RUN\n\n` +
          `This will remove the restrictive constraint.\n\n` +
          `Error: ${error.message}`;
        throw new Error(errorMsg);
      }
      throw error;
    }
    return toCamelCase(data);
  }

  static async updateService(id: string, serviceData: any) {
    // Ensure name is properly trimmed if provided
    const cleanedData = { ...toSnakeCase(serviceData) };
    if (cleanedData.name) {
      cleanedData.name = cleanedData.name.trim();
      if (cleanedData.name.length === 0) {
        throw new Error('Service name cannot be empty');
      }
      if (cleanedData.name.length > 100) {
        throw new Error('Service name cannot exceed 100 characters');
      }
    }

    const { data, error } = await supabase
      .from('services')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Provide more helpful error message for constraint violations
      if (error.code === '23514' ||
        error.message?.includes('check constraint') ||
        error.message?.includes('services_name_check') ||
        error.message?.includes('name IN') ||
        error.message?.includes('constraint') ||
        error.message?.includes('violates check')) {
        const errorMsg = `⚠️ DATABASE CONSTRAINT ERROR ⚠️\n\n` +
          `The services table has a restrictive constraint.\n\n` +
          `TO FIX:\n` +
          `1. Open Supabase Dashboard → SQL Editor\n` +
          `2. Copy ALL contents of RUN_THIS_NOW.sql (in project root)\n` +
          `3. Paste and click RUN\n\n` +
          `This will remove the restrictive constraint.\n\n` +
          `Error: ${error.message}`;
        throw new Error(errorMsg);
      }
      throw error;
    }
    return toCamelCase(data);
  }

  // Booking operations
  static async createBooking(bookingData: any) {
    // Ensure booking_type is included in the data
    const bookingDataWithType = {
      ...toSnakeCase(bookingData),
      booking_type: bookingData.bookingType || bookingData.booking_type || 'pickup_delivery',
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingDataWithType)
      .select(`
        *,
        client:users!bookings_client_id_fkey(id, name, email, phone),
        driver:users!bookings_driver_id_fkey(id, name, phone, availability),
        car_wash:users!bookings_car_wash_id_fkey(id, name, car_wash_name, location),
        vehicle:vehicles(*),
        service:services(*)
      `)
      .single();

    if (error) throw error;
    const result = toCamelCase(data);
    // Map relations to expected format
    if (result.client) result.clientId = result.client;
    if (result.driver) result.driverId = result.driver;
    if (result.carWash) result.carWashId = result.carWash;
    if (result.vehicle) result.vehicleId = result.vehicle;
    if (result.service) result.serviceId = result.service;
    return result;
  }

  static async getBookings(filters: any = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        client:users!bookings_client_id_fkey(id, name, email, phone),
        driver:users!bookings_driver_id_fkey(id, name, phone, availability),
        car_wash:users!bookings_car_wash_id_fkey(id, name, car_wash_name, location),
        vehicle:vehicles(*),
        service:services(*)
      `);

    for (const [key, value] of Object.entries(filters)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      query = query.eq(snakeKey, value);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error in getBookings:', error);
      console.error('   Filters:', filters);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    const rawData = data || [];
    const results = toCamelCase(rawData);

    return results.map((result: any) => {
      if (!result || typeof result !== 'object') return null;
      if (result.client) result.clientId = result.client;
      if (result.driver) result.driverId = result.driver;
      if (result.carWash) result.carWashId = result.carWash;
      if (result.vehicle) result.vehicleId = result.vehicle;
      if (result.service) result.serviceId = result.service;
      return result;
    }).filter((result: any): result is any => result !== null);
  }

  static async getBookingById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:users!bookings_client_id_fkey(*),
        driver:users!bookings_driver_id_fkey(*),
        car_wash:users!bookings_car_wash_id_fkey(*),
        vehicle:vehicles(*),
        service:services(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    const result = toCamelCase(data);
    // Map relations to expected format
    if (result.client) result.clientId = result.client;
    if (result.driver) result.driverId = result.driver;
    if (result.carWash) result.carWashId = result.carWash;
    if (result.vehicle) result.vehicleId = result.vehicle;
    if (result.service) result.serviceId = result.service;
    return result;
  }

  static async updateBooking(id: string, bookingData: any) {
    const { data, error } = await supabase
      .from('bookings')
      .update(toSnakeCase(bookingData))
      .eq('id', id)
      .select(`
        *,
        client:users!bookings_client_id_fkey(*),
        driver:users!bookings_driver_id_fkey(*),
        car_wash:users!bookings_car_wash_id_fkey(*),
        vehicle:vehicles(*),
        service:services(*)
      `)
      .single();

    if (error) throw error;
    const result = toCamelCase(data);
    // Map relations to expected format
    if (result.client) result.clientId = result.client;
    if (result.driver) result.driverId = result.driver;
    if (result.carWash) result.carWashId = result.carWash;
    if (result.vehicle) result.vehicleId = result.vehicle;
    if (result.service) result.serviceId = result.service;
    return result;
  }

  // Payment operations
  static async createPayment(paymentData: any) {
    const { data, error } = await supabase
      .from('payments')
      .insert(toSnakeCase(paymentData))
      .select(`
        *,
        booking_id:bookings(*)
      `)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  // Booking status log
  static async createBookingStatusLog(entry: {
    bookingId: string;
    actorId: string;
    actorRole: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    metadata?: any;
  }) {
    const payload = toSnakeCase({
      bookingId: entry.bookingId,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      fromStatus: entry.fromStatus || null,
      toStatus: entry.toStatus || null,
      note: entry.note || null,
      metadata: entry.metadata || null,
    });

    const { data, error } = await supabase
      .from('booking_status_log')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async getPaymentByBookingId(bookingId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking_id:bookings(*)
      `)
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  }

  static async updatePayment(id: string, paymentData: any) {
    const { data, error } = await supabase
      .from('payments')
      .update(toSnakeCase(paymentData))
      .eq('id', id)
      .select(`
        *,
        booking_id:bookings(*)
      `)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  // Driver operations
  static async getAvailableDrivers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('availability', true)
      .eq('is_active', true);

    if (error) throw error;
    return toCamelCase(data || []);
  }

  static async getDrivers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  }

  static async updateUser(id: string, userData: any) {
    // Clean up empty strings to null to avoid database errors for numeric columns
    const cleanedData = { ...userData };
    for (const key in cleanedData) {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    }

    // Convert to snake_case
    const snakeCaseData = toSnakeCase(cleanedData);

    // Try to update, and if column doesn't exist, retry without problematic fields
    let updateData = { ...snakeCaseData };
    let { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // If error is about missing column, remove car_wash_picture_url and retry
    if (error && (error.message?.includes('car_wash_picture_url') || error.code === '42703')) {
      console.warn('car_wash_picture_url column not found, removing from update...');
      delete updateData.car_wash_picture_url;
      
      const retryResult = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (retryResult.error) {
        console.error('Error updating user:', retryResult.error);
        throw retryResult.error;
      }
      
      return toCamelCase(retryResult.data);
    }

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    return toCamelCase(data);
  }

  // Car Wash operations
  static async getCarWashes(includeServices: boolean = false) {
    let query = supabase
      .from('users')
      .select(includeServices ? `
        *,
        services:services!services_car_wash_id_fkey(*)
      ` : '*')
      .eq('role', 'carwash')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Filter to only show approved car washes (if approval_status column exists)
    const carWashes = toCamelCase(data || []);
    const filtered = carWashes.filter((cw: any) => {
      // If approval_status exists and is set, only show approved ones
      // If approval_status is null/undefined (column doesn't exist or not set), show all (for backward compatibility)
      const approvalStatus = cw.approvalStatus || cw.approval_status;
      return !approvalStatus || approvalStatus === 'approved';
    });

    // Filter services to only active ones if included
    if (includeServices) {
      return filtered.map((cw: any) => ({
        ...cw,
        services: (cw.services || []).filter((s: any) => s.isActive !== false),
      }));
    }

    return filtered;
  }

  // Admin operations
  static async getAllUsers(role?: string) {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;
    return toCamelCase(data || []);
  }

  static async getBookingStats(startDate?: string, endDate?: string) {
    let query = supabase
      .from('bookings')
      .select('status, total_amount, payment_status');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return toCamelCase(data || []);
  }

  // Notification operations
  static async markBookingNotificationAsRead(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ notification_read: true })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  }

  static async markAllBookingNotificationsAsRead(userId: string, role: string) {
    let query = supabase
      .from('bookings')
      .update({ notification_read: true });

    if (role === 'client') {
      query = query.eq('client_id', userId);
    } else if (role === 'driver') {
      query = query.eq('driver_id', userId);
    } else if (role === 'carwash') {
      query = query.eq('car_wash_id', userId);
    } else if (role === 'admin' || role === 'subadmin') {
      // For admins, we just mark everything as read or nothing? 
      // Actually admins might want to mark all bookings they oversee as read.
      // For now, let's just make it do nothing or mark all?
      // Usually admins don't have "their" bookings in the same way.
      return true;
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }

  // Location operations
  static async createOrUpdateLocation(userId: string, latitude: number, longitude: number, accuracyMeters?: number) {
    const { data, error } = await supabase
      .from('user_locations')
      .upsert(
        {
          user_id: userId,
          latitude,
          longitude,
          accuracy_meters: accuracyMeters || null,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
    return toCamelCase(data);
  }

  static async getUserLocation(userId: string) {
    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user location:', error);
      throw error;
    }

    return data ? toCamelCase(data) : null;
  }

  static async getNearbyCarWashes(latitude: number, longitude: number, radiusKm: number = 10) {
    const { data, error } = await supabase.rpc('nearby_car_washes', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
    });

    if (error) {
      console.error('Error fetching nearby car washes:', error);
      throw error;
    }

    return toCamelCase(data || []);
  }

  static async getBookingCounterpartyLocation(bookingId: string, userId: string) {
    // First, fetch the booking to get counterparty ID
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Determine counterparty based on user role
    let counterpartyId: string | null = null;

    if (booking.clientId === userId) {
      counterpartyId = booking.driverId;
    } else if (booking.driverId === userId) {
      counterpartyId = booking.clientId;
    } else if (booking.carWashId === userId) {
      // Car wash can see both client and driver locations
      // Return both locations
      const clientLocation = await this.getUserLocation(booking.clientId);
      const driverLocation = await this.getUserLocation(booking.driverId);
      return {
        client: clientLocation,
        driver: driverLocation,
      };
    } else {
      throw new Error('Unauthorized: User is not part of this booking');
    }

    if (!counterpartyId) {
      return null;
    }

    return await this.getUserLocation(counterpartyId);
  }

  static async updateCarWashLocation(carWashId: string, latitude: number, longitude: number) {
    // Check if location already set (enforce set-once policy)
    const { data: existing } = await supabase
      .from('car_washes')
      .select('latitude, longitude, id')
      .eq('id', carWashId)
      .single();

    if (existing?.latitude && existing?.longitude) {
      throw new Error('Location already set. Contact admin to update.');
    }

    const { data, error } = await supabase
      .from('car_washes')
      .update({ latitude, longitude })
      .eq('id', carWashId)
      .select()
      .single();

    if (error) {
      console.error('Error updating car wash location:', error);
      throw error;
    }

    return toCamelCase(data);
  }
}
