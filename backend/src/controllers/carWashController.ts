import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DBService } from '../services/db-service';
import { AuthRequest } from '../middleware/auth';
import { 
  BadRequestError, 
  NotFoundError, 
  ForbiddenError, 
  ValidationError,
  InternalServerError,
  ConflictError 
} from '../shared/errors/AppError';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ApiSuccessResponse } from '../shared/types/api.types';
import { parseStoredCoordinates, resolveCarWashCoordinates } from '../utils/lusakaCoordinates';
import { supabase } from '../config/supabase';

// @desc    Get car wash services
// @route   GET /api/carwash/services
// @access  Public
export const getServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { carWashId } = req.query as any;
  
  if (carWashId) {
    const services = await DBService.getServicesByCarWash(carWashId);
    
    if (!Array.isArray(services)) {
      throw new InternalServerError('Invalid data format received from database');
    }

    const response: ApiSuccessResponse = {
      success: true,
      count: services.length,
      data: services,
    };

    res.json(response);
  } else {
    // Get all active services from all car washes
    const { supabase } = await import('../config/supabase');
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        car_wash_id:users!services_car_wash_id_fkey(id, name, car_wash_name, location)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) {
      throw new InternalServerError(`Failed to fetch services: ${error.message}`);
    }
    
    const response: ApiSuccessResponse = {
      success: true,
      count: data?.length || 0,
      data: data || [],
    };

    res.json(response);
  }
});

// @desc    Get all car washes
// @route   GET /api/carwash/list
// @access  Public
export const getCarWashes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const includeServices = req.query.includeServices === 'true';
  const carWashes = await DBService.getCarWashes(includeServices);

  if (!Array.isArray(carWashes)) {
    throw new InternalServerError('Invalid data format received from database');
  }

  const lusakaCarWashes = carWashes
    .map((cw: any) => {
      const { password, ...rest } = cw;
      const hadStored =
        parseStoredCoordinates(rest.locationCoordinates) ??
        parseStoredCoordinates(rest.location_coordinates);
      const coords = resolveCarWashCoordinates(rest);
      if (coords) {
        rest.locationCoordinates = coords;
        if (!hadStored && rest.id) {
          void supabase
            .from('users')
            .update({ location_coordinates: JSON.stringify(coords) })
            .eq('id', rest.id);
        }
      }
      return rest;
    })
    .filter((cw: any) => Boolean(cw.locationCoordinates));

  const response: ApiSuccessResponse = {
    success: true,
    count: lusakaCarWashes.length,
    data: lusakaCarWashes,
  };

  res.json(response);
});

// @desc    Create/Update service
// @route   POST /api/carwash/services
// @route   PUT /api/carwash/services/:id
// @access  Private (Car Wash)
export const createOrUpdateService = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap: Record<string, string[]> = {};
    errors.array().forEach((error: any) => {
      const field = error.param || 'general';
      if (!errorMap[field]) {
        errorMap[field] = [];
      }
      errorMap[field].push(error.msg || error.message);
    });
    throw new ValidationError('Validation failed', errorMap);
  }

  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  const { name, description, price, isActive } = req.body;
  
  // Validate and clean the name
  if (!name || typeof name !== 'string') {
    throw new BadRequestError('Service name is required and must be a string');
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new BadRequestError('Service name cannot be empty');
  }
  
  if (trimmedName.length > 100) {
    throw new BadRequestError('Service name cannot exceed 100 characters');
  }

  // Validate price
  if (price === undefined || price === null) {
    throw new BadRequestError('Price is required');
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum < 0) {
    throw new BadRequestError('Price must be a positive number');
  }

  const serviceId = req.params.id;

  if (serviceId) {
    // Update existing service
    const service = await DBService.getServiceById(serviceId);
    
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    const serviceCarWashId = typeof service.carWashId === 'object' ? service.carWashId?.id : service.carWashId;
    if (serviceCarWashId !== req.user.id) {
      throw new ForbiddenError('Service does not belong to your car wash');
    }

    const updatedService = await DBService.updateService(serviceId, {
      name: trimmedName,
      description: description?.trim() || null,
      price: priceNum,
      isActive: isActive !== undefined ? isActive : service.isActive,
    });

    if (!updatedService) {
      throw new InternalServerError('Failed to update service');
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: updatedService,
    };

    res.json(response);
  } else {
    // Check service limit (max 20 services per car wash) - include inactive services in count
    const existingServices = await DBService.getServicesByCarWash(req.user.id, true);
    
    if (!Array.isArray(existingServices)) {
      throw new InternalServerError('Failed to fetch existing services');
    }

    if (existingServices.length >= 20) {
      throw new ConflictError('Maximum limit of 20 services per car wash reached. Please delete or deactivate existing services to add new ones.');
    }

    // Create new service
    const service = await DBService.createService({
      carWashId: req.user.id,
      name: trimmedName,
      description: description?.trim() || null,
      price: priceNum,
      isActive: isActive !== undefined ? isActive : true,
    });

    if (!service || !service.id) {
      throw new InternalServerError('Failed to create service');
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: service,
    };

    res.status(201).json(response);
  }
});

// @desc    Get car wash bookings
// @route   GET /api/carwash/bookings
// @access  Private (Car Wash)
export const getCarWashBookings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  const filters: any = { carWashId: req.user.id };
  
  if (req.query.status) {
    filters.status = req.query.status as string;
  }

  const bookings = await DBService.getBookings(filters);

  // Validate bookings array
  if (!Array.isArray(bookings)) {
    throw new InternalServerError('Invalid data format received from database');
  }

  const response: ApiSuccessResponse = {
    success: true,
    count: bookings.length,
    data: bookings,
  };

  res.json(response);
});

// @desc    Get car wash dashboard stats
// @route   GET /api/carwash/dashboard
// @access  Private (Car Wash)
export const getCarWashDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new ForbiddenError('User not authenticated');
  }

  const carWashId = req.user.id;
  const bookings = await DBService.getBookings({ carWashId });

  if (!Array.isArray(bookings)) {
    throw new InternalServerError('Invalid data format received from database');
  }

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b: any) => ['pending', 'accepted', 'picked_up', 'at_wash'].includes(b.status)).length,
    inProgressBookings: bookings.filter((b: any) => ['waiting_bay', 'washing_bay', 'drying_bay'].includes(b.status)).length,
    completedBookings: bookings.filter((b: any) => b.status === 'completed' || b.status === 'wash_completed').length,
    totalRevenue: Math.round(
      bookings
        .filter((b: any) => b.paymentStatus === 'paid')
        .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0) * 100
    ) / 100,
  };

  const response: ApiSuccessResponse = {
    success: true,
    data: stats,
  };

  res.json(response);
});
