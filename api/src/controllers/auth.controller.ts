import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import User from '../models/User';
import Reservation from '../models/Reservation';
import { AuthRequest, UserRole, ReservationType, ReservationStatus } from '../types';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { successResponse } from '../utils/helpers';
import otpService from '../services/otp.service';
import { OTPType } from '../models/OTP';

/**
 * Generate JWT token
 */
const generateToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { id: userId, email, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE } as jwt.SignOptions
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRE } as jwt.SignOptions
  );
};

/**
 * Convert soft reservations to firm reservations
 * When a guest user registers, link their soft reservations to the new account
 */
const convertSoftReservationsToFirm = async (
  userId: string,
  email: string
): Promise<number> => {
  try {
    console.log(`🔄 Checking for soft reservations for email: ${email}`);

    // Find all soft reservations with matching guest email
    const softReservations = await Reservation.find({
      reservationType: ReservationType.SOFT_RESERVE,
      'guestInfo.email': email.toLowerCase(),
      status: { $in: ['pending', 'confirmed'] }, // Only active reservations
    });

    if (softReservations.length === 0) {
      console.log('ℹ️ No soft reservations found for this email');
      return 0;
    }

    console.log(`📋 Found ${softReservations.length} soft reservation(s) to convert`);

    // Convert each soft reservation to firm reservation
    let convertedCount = 0;
    for (const reservation of softReservations) {
      console.log(`🔄 Converting reservation ${reservation._id}:`, {
        car: reservation.carId,
        dates: `${reservation.startDate} to ${reservation.endDate}`,
        guestEmail: reservation.guestInfo?.email,
      });

      // Update reservation
      reservation.userId = userId;
      reservation.reservationType = ReservationType.FIRM_RESERVE;
      reservation.status = ReservationStatus.CONFIRMED;
      reservation.guestInfo = undefined; // Remove guest info
      reservation.softReserveExpiry = undefined; // Remove expiry

      await reservation.save();
      convertedCount++;

      console.log(`✅ Converted reservation ${reservation._id} to firm reserve`);
    }

    console.log(`🎉 Successfully converted ${convertedCount} reservation(s)`);
    return convertedCount;
  } catch (error) {
    console.error('❌ Error converting soft reservations:', error);
    // Don't throw - registration should succeed even if conversion fails
    return 0;
  }
};

/**
 * Register new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, phone, role, businessName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Validate business owner requirements
    if (role === UserRole.BUSINESS_OWNER && !businessName) {
      throw new BadRequestError('Business name is required for business owner registration');
    }

    // Create user data
    const userData: any = {
      email,
      password,
      phone,
      role: role || UserRole.USER,
      profile: {
        savedPaymentMethods: [],
      },
    };

    // Add business name for business owners
    if (role === UserRole.BUSINESS_OWNER && businessName) {
      userData.profile.businessName = businessName;
    }

    // Create user
    const user = await User.create(userData);

    // Convert any soft reservations to firm reservations
    const userId = (user._id as any).toString();
    const convertedCount = await convertSoftReservationsToFirm(userId, user.email);
    if (convertedCount > 0) {
      console.log(`✅ Converted ${convertedCount} soft reservation(s) to firm reservations for user: ${user.email}`);
    }

    // Generate tokens
    const token = generateToken(userId, user.email, user.role);
    const refreshToken = generateRefreshToken(userId);

    // Get full user object
    const userObject = user.toObject();
    delete userObject.password;

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          user: userObject,
          token,
          refreshToken,
          convertedReservations: convertedCount,
        },
        convertedCount > 0 
          ? `Registration successful! We found ${convertedCount} previous booking${convertedCount > 1 ? 's' : ''} and linked them to your account!`
          : SUCCESS_MESSAGES.REGISTRATION_SUCCESS
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const token = generateToken((user._id as any).toString(), user.email, user.role);
    const refreshToken = generateRefreshToken((user._id as any).toString());

    // Get full user object without password
    const userObject = user.toObject();
    delete userObject.password;

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          user: userObject,
          token,
          refreshToken,
        },
        SUCCESS_MESSAGES.LOGIN_SUCCESS
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findById((req.user as any).id);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { id: string };

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Generate new tokens
    const newToken = generateToken((user._id as any).toString(), user.email, user.role);
    const newRefreshToken = generateRefreshToken((user._id as any).toString());

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        token: newToken,
        refreshToken: newRefreshToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth callback
 */
export const googleCallback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Google authentication failed');
    }

    const user = req.user as any;

    // Generate tokens
    const token = generateToken((user._id as any).toString(), user.email, user.role);
    const refreshToken = generateRefreshToken((user._id as any).toString());

    // Redirect to frontend with tokens
    const frontendUrl = config.FRONTEND_URL;
    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Clear the token cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for registration
 */
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, type = OTPType.REGISTRATION } = req.body;

    // Check if user already exists for registration OTP
    if (type === OTPType.REGISTRATION) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new BadRequestError(ERROR_MESSAGES.EMAIL_EXISTS);
      }
    }

    // Check if user exists for forgot password OTP
    if (type === OTPType.FORGOT_PASSWORD) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new BadRequestError('No account found with this email address');
      }
    }

    // Send OTP
    await otpService.sendOTP(email, type);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        { email },
        'Verification code sent to your email'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and complete registration
 */
export const verifyOTPAndRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code, password, phone, role, businessName } = req.body;

    // Verify OTP
    await otpService.verifyOTP(email, code, OTPType.REGISTRATION);

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Validate business owner requirements
    if (role === UserRole.BUSINESS_OWNER && !businessName) {
      throw new BadRequestError('Business name is required for business owner registration');
    }

    // Create user data
    const userData: any = {
      email,
      password,
      phone,
      role: role || UserRole.USER,
      profile: {
        savedPaymentMethods: [],
      },
    };

    // Add business name for business owners
    if (role === UserRole.BUSINESS_OWNER && businessName) {
      userData.profile.businessName = businessName;
    }

    // Create user
    const user = await User.create(userData);

    // Convert any soft reservations to firm reservations
    const userId = (user._id as any).toString();
    const convertedCount = await convertSoftReservationsToFirm(userId, user.email);

    // Generate tokens
    const token = generateToken(userId, user.email, user.role);
    const refreshToken = generateRefreshToken(userId);

    // Get full user object
    const userObject = user.toObject();
    delete userObject.password;

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          user: userObject,
          token,
          refreshToken,
          convertedReservations: convertedCount,
        },
        convertedCount > 0
          ? `Registration successful! We found ${convertedCount} previous booking${convertedCount > 1 ? 's' : ''} and linked them to your account!`
          : SUCCESS_MESSAGES.REGISTRATION_SUCCESS
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, type = OTPType.REGISTRATION } = req.body;

    // Resend OTP with rate limiting
    await otpService.resendOTP(email, type);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        { email },
        'Verification code resent to your email'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - send OTP
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('No account found with this email address');
    }

    // Send OTP
    await otpService.sendOTP(email, OTPType.FORGOT_PASSWORD);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        { email },
        'Password reset code sent to your email'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    // Verify OTP
    await otpService.verifyOTP(email, code, OTPType.FORGOT_PASSWORD);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        null,
        'Password reset successfully. You can now log in with your new password.'
      )
    );
  } catch (error) {
    next(error);
  }
};

