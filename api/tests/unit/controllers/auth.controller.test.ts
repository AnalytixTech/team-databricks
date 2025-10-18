import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as authController from '../../../src/controllers/auth.controller';
import User from '../../../src/models/User';
import Reservation from '../../../src/models/Reservation';
import { createTestUser } from '../../helpers/test-utils';
import { AuthRequest } from '../../../src/types';

// Mock the User model
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Reservation');

// Mock custom error classes
jest.mock('../../../src/utils/errors', () => ({
  BadRequestError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'BadRequestError';
    }
  },
  UnauthorizedError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UnauthorizedError';
    }
  },
}));

// Mock helpers
jest.mock('../../../src/utils/helpers', () => ({
  successResponse: (data: any, message?: string) => ({
    success: true,
    data,
    ...(message && { message }),
  }),
}));

// Mock config
jest.mock('../../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRE: '7d',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_REFRESH_EXPIRE: '30d',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new regular user successfully', async () => {
      const userData = createTestUser();
      mockRequest.body = userData;

      const mockUser = {
        _id: 'user-id',
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await authController.register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: userData.email,
            }),
            token: expect.any(String),
          }),
        })
      );
    });

    it('should register a business owner with business name', async () => {
      const userData = createTestUser({ 
        role: 'business_owner',
        businessName: 'Test Business'
      });
      mockRequest.body = userData;

      const mockUser = {
        _id: 'user-id',
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await authController.register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            token: expect.any(String),
          }),
        })
      );
    });

    it('should fail if email already exists', async () => {
      const userData = createTestUser();
      mockRequest.body = userData;

      (User.findOne as jest.Mock).mockResolvedValue({ email: userData.email });

      await authController.register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already registered',
        })
      );
    });

    it('should convert soft reservations to firm when registering', async () => {
      const userData = createTestUser();
      const softReservations = [
        { 
          _id: 'res-1', 
          guestInfo: { email: userData.email }, 
          reservationType: 'soft-reserve',
          status: 'pending',
          save: jest.fn().mockResolvedValue(undefined)
        },
        { 
          _id: 'res-2', 
          guestInfo: { email: userData.email }, 
          reservationType: 'soft-reserve',
          status: 'pending',
          save: jest.fn().mockResolvedValue(undefined)      
        },
      ];
      
      mockRequest.body = userData;

      const mockUser = {
        _id: 'user-id',
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Reservation.find as jest.Mock).mockResolvedValue(softReservations);

      await authController.register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Reservation.find).toHaveBeenCalledWith({
        reservationType: 'soft-reserve',
        'guestInfo.email': userData.email.toLowerCase(),
        status: { $in: ['pending', 'confirmed'] },  
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            convertedReservations: 2,
          }),
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const userData = createTestUser();
      const mockUser = {
        _id: 'user-id',
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        password: 'hashed-password',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        email: userData.email,
        password: userData.password,
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(userData.password);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: userData.email,
            }),
            token: expect.any(String),
          }),
        })
      );
    });

    it('should fail with invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authController.login(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password',
        })
      );
    });
  });

  describe('googleCallback', () => {
    it('should handle Google OAuth callback', async () => {
      const userId = new Types.ObjectId();
      const googleUser = {
        _id: userId,
        id: userId.toString(),
        email: 'google@example.com',
        role: 'regular_user',
      } as any;

      mockRequest.user = googleUser;

      await authController.googleCallback(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth/callback?token=')
      );
    });

    it('should handle missing user in Google callback', async () => {
      mockRequest.user = undefined;

      await authController.googleCallback(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Google authentication failed',
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await authController.logout(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith('token', '', {
        httpOnly: true,
        expires: new Date(0),
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const userId = new Types.ObjectId();
      const currentUser = {
        _id: userId,
        id: userId.toString(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'regular_user',
      } as any;

      const mockUserFromDB = {
        _id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'regular_user',
      };

      mockRequest.user = currentUser;
      (User.findById as jest.Mock).mockResolvedValue(mockUserFromDB);

      await authController.getCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUserFromDB,
      });
    });

    it('should handle missing user', async () => {
      mockRequest.user = undefined;

      await authController.getCurrentUser(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unauthorized access',
        })
      );
    });
  });
});
