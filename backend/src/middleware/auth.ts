import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DBService } from '../services/db-service';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/AppError';
import { asyncHandler } from '../shared/errors/errorHandler';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('No token provided. Please authenticate.');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };

    if (!decoded.id) {
      throw new UnauthorizedError('Invalid token format.');
    }

    // Find user in database
    const user = await DBService.findUserById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('User not found. Token may be invalid.');
    }

    // Check if user is active
    if (user.isActive === false) {
      throw new UnauthorizedError('Account is inactive. Please contact support.');
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as AuthRequest['user'];

    next();
  } catch (error: any) {
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired. Please login again.');
    }
    // Re-throw if it's already an AppError
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    // Otherwise, throw generic unauthorized error
    throw new UnauthorizedError('Authentication failed.');
  }
});

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied.Required role: ${roles.join(' or ')}. Your role: ${req.user.role} `
      );
    }

    next();
  };
};
