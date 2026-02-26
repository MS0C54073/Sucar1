import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DBService } from '../services/db-service';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  ValidationError,
  InternalServerError
} from '../shared/errors/AppError';
import { asyncHandler } from '../shared/errors/errorHandler';
import { ApiSuccessResponse } from '../shared/types/api.types';
import { SMSService } from '../services/smsService';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const { name, email, password, phone, nrc, role, ...roleSpecificData } = req.body;

  // Validate role
  const validRoles = ['client', 'driver', 'carwash', 'admin'];
  if (!role || !validRoles.includes(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Check if user exists
  const userByEmail = await DBService.findUserByEmail(email);
  const userByNrc = await DBService.findUserByNrc(nrc);

  if (userByEmail) {
    throw new ConflictError(`A user with email ${email} already exists`);
  }

  if (userByNrc) {
    throw new ConflictError(`A user with NRC ${nrc} already exists`);
  }

  // Create user based on role
  const userData: any = {
    name,
    email,
    password,
    phone,
    nrc,
    role,
  };

  if (role === 'client') {
    userData.businessName = roleSpecificData.businessName;
    userData.isBusiness = roleSpecificData.isBusiness || false;
  } else if (role === 'driver') {
    userData.licenseNo = roleSpecificData.licenseNo;
    userData.licenseType = roleSpecificData.licenseType;
    userData.licenseExpiry = roleSpecificData.licenseExpiry;
    userData.address = roleSpecificData.address;
    userData.maritalStatus = roleSpecificData.maritalStatus;
    userData.availability = true;
  } else if (role === 'carwash') {
    userData.carWashName = roleSpecificData.carWashName;
    userData.location = roleSpecificData.location;
    userData.washingBays = roleSpecificData.washingBays;
  }

  // Create user
  const user = await DBService.createUser(userData);

  if (!user || !user.id) {
    throw new InternalServerError('Failed to create user');
  }

  const response: ApiSuccessResponse = {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user.id),
    },
  };

  res.status(201).json(response);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  console.log(`\n🔐 Login attempt for: ${email}`);
  console.log(`   IP: ${req.ip}`);

  // Find user
  let user;
  try {
    user = await DBService.findUserByEmail(email);
  } catch (error: any) {
    console.error(`❌ Database error during login:`, error);
    
    // Check if this is a connection error
    if (error.message?.includes('fetch failed') || 
        error.message?.includes('ECONNREFUSED') ||
        error.code === 'PGRST116' ||
        error.message?.includes('connection')) {
      console.error('💡 Database connection issue detected!');
      console.error('   This usually means Supabase is not running.');
      console.error('   Fix: Start Supabase with: supabase start');
      throw new InternalServerError('Database connection failed. Please check if Supabase is running.');
    }
    
    // Re-throw other database errors
    throw error;
  }
  
  if (!user) {
    console.log(`❌ Login failed: User not found for email ${email}`);
    throw new UnauthorizedError('Invalid email or password');
  }

  console.log(`✅ User found: ${user.name} (${user.role})`);

  // Verify password
  // Check both camelCase and snake_case for password field
  const userPassword = user.password || (user as any).password_hash || (user as any).passwordHash;
  
  if (!userPassword) {
    console.log(`❌ Login failed: User ${email} has no password set`);
    console.log(`   User object keys:`, Object.keys(user));
    console.log(`   Password field:`, user.password ? 'exists' : 'missing');
    throw new UnauthorizedError('Invalid email or password');
  }

  console.log(`   Password hash found (length: ${userPassword.length})`);
  
  const isMatch = await DBService.comparePassword(password, userPassword);
  if (!isMatch) {
    console.log(`❌ Login failed: Password mismatch for email ${email}`);
    console.log(`   This could mean:`);
    console.log(`   1. Password is incorrect`);
    console.log(`   2. Password hash in database is invalid`);
    console.log(`   3. Password was not hashed with bcrypt`);
    throw new UnauthorizedError('Invalid email or password');
  }

  console.log(`✅ Password verified`);

  // Check if user is active
  const isActive = user.isActive !== undefined ? user.isActive : (user.is_active !== undefined ? user.is_active : true);
  if (isActive === false) {
    console.log(`❌ Login failed: Account is deactivated`);
    throw new UnauthorizedError('Account is deactivated. Please contact support.');
  }

  console.log(`✅ Account is active`);

  // Generate token
  const token = generateToken(user.id);

  // Build response data
  const { password: _, ...userWithoutPassword } = user;
  const responseData: any = {
    ...userWithoutPassword,
    token: token,
  };

  console.log(`✅ Login successful for ${email} (${user.role})`);

  const response: ApiSuccessResponse = {
    success: true,
    data: responseData,
  };

  res.json(response);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new UnauthorizedError('User not authenticated');
  }

  const user = await DBService.findUserById(req.user.id);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const { password, ...userWithoutPassword } = user;

  const response: ApiSuccessResponse = {
    success: true,
    data: userWithoutPassword,
  };

  res.json(response);
});
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Filter out role-specific fields that don't apply to this user
  const userData: any = { ...req.body };
  
  // Only include carWashPictureUrl if user is a carwash
  if (req.user.role !== 'carwash' && userData.carWashPictureUrl !== undefined) {
    delete userData.carWashPictureUrl;
  }

  // Only include driver-specific fields if user is a driver
  if (req.user.role !== 'driver') {
    if (userData.licenseNumber !== undefined) delete userData.licenseNumber;
    if (userData.licenseType !== undefined) delete userData.licenseType;
    if (userData.licenseExpiry !== undefined) delete userData.licenseExpiry;
    if (userData.maritalStatus !== undefined) delete userData.maritalStatus;
  }

  // Only include client-specific fields if user is a client
  if (req.user.role !== 'client') {
    if (userData.businessName !== undefined) delete userData.businessName;
    if (userData.isBusiness !== undefined) delete userData.isBusiness;
  }

  // Only include carwash-specific fields if user is a carwash
  if (req.user.role !== 'carwash') {
    if (userData.carWashName !== undefined) delete userData.carWashName;
    if (userData.location !== undefined) delete userData.location;
    if (userData.washingBays !== undefined) delete userData.washingBays;
  }

  const user = await DBService.updateUser(req.user.id, userData);

  if (!user) {
    throw new InternalServerError('Failed to update profile');
  }

  const { password, ...userWithoutPassword } = user;

  const response: ApiSuccessResponse = {
    success: true,
    data: userWithoutPassword,
    message: 'Profile updated successfully',
  };

  res.json(response);
});
/**
 * @desc    Google Login
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { token, role } = req.body;

  if (!token) {
    throw new BadRequestError('Google token is required');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestError('Invalid Google token');
    }

    const { email, name, sub: googleId, picture } = payload;

    // Check if user exists by google_id
    let user = await DBService.findUserByGoogleId(googleId);

    // If not found, check by email
      if (!user) {
        user = await DBService.findUserByEmail(email);

        if (user) {
          // Link google account to existing email account
          await DBService.updateUserGoogleId(user.id, googleId);
          user = await DBService.findUserById(user.id);
        }
      }

    // If still not found, create new user (Registration)
    if (!user) {
      if (!role) {
        throw new BadRequestError('User role is required for new accounts');
      }

      user = await DBService.createUser({
        name: name || 'Google User',
        email: email,
        google_id: googleId,
        role: role || 'client', // Default to client if not provided
        auth_provider: 'google',
        phone: '', // Placeholder - user can update later
        nrc: `G-${googleId.substring(0, 8)}`, // Temporary NRC - user should update
      });
    }

    const jwtToken = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: jwtToken,
      },
    });
  } catch (error) {
    console.error('Google verification error:', error);
    throw new UnauthorizedError('Google authentication failed');
  }
});

/**
 * @desc    Send OTP to phone
 * @route   POST /api/auth/phone/send-code
 * @access  Public
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    throw new BadRequestError('Phone number is required');
  }

  // Format phone number (ensure it starts with +)
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code in database (for fallback if Twilio not configured)
  await DBService.storePhoneVerificationCode(formattedPhone, code, 10);

  // Try to send via Twilio
  const smsResult = await SMSService.sendVerificationCode(formattedPhone);

  // If Twilio is not configured, we'll use the stored code
  if (!smsResult && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)) {
    console.log(`📱 Mock OTP for ${formattedPhone}: ${code} (Twilio not configured)`);
  }

  res.status(200).json({
    success: true,
    message: 'Verification code sent',
    // In development, return code for testing (remove in production!)
    ...(process.env.NODE_ENV === 'development' && { code }),
  });
});

/**
 * @desc    Verify OTP and login/register
 * @route   POST /api/auth/phone/verify
 * @access  Public
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phone, code, role, name } = req.body;

  if (!phone || !code) {
    throw new BadRequestError('Phone and code are required');
  }

  // Format phone number
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

  // Try Twilio verification first
  let isValid = await SMSService.verifyCode(formattedPhone, code);

  // If Twilio not configured or verification fails, check database
  if (!isValid && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)) {
    isValid = await DBService.verifyPhoneCode(formattedPhone, code);
  }

  if (!isValid) {
    throw new UnauthorizedError('Invalid or expired verification code');
  }

  // Check if user exists by phone
  let user = await DBService.findUserByPhone(formattedPhone);

  // If not found, create new user
  if (!user) {
    if (!role || !name) {
      throw new BadRequestError('Role and Name are required for new registration');
    }

    user = await DBService.createUser({
      name,
      phone: formattedPhone,
      role,
      auth_provider: 'phone',
      phone_verified: true,
      email: `${formattedPhone.replace(/[^0-9]/g, '')}@sucar.placeholder`, // Placeholder email
      nrc: `P-${formattedPhone.substring(formattedPhone.length - 8)}`, // Temporary NRC - user should update
    });
  } else {
    // Update existing user to mark phone as verified
    await DBService.updateUser(user.id, {
      phone_verified: true,
      auth_provider: 'phone',
    });
    user = await DBService.findUserById(user.id);
  }

  const jwtToken = generateToken(user.id);

  const { password, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    data: {
      ...userWithoutPassword,
      token: jwtToken,
    },
  });
});
