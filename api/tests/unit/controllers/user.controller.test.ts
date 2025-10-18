import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as userController from '../../../src/controllers/user.controller';
import User from '../../../src/models/User';
import paymentService from '../../../src/services/payment.service';
import { AuthRequest } from '../../../src/types';
import { UserRole } from '../../../src/types';
import { 
  createTestUser, 
  createMockRequest, 
  createMockResponse, 
  expectErrorWithStatus,
  expectSuccessResponse 
} from '../../helpers/test-utils';

// Mock the models and services
jest.mock('../../../src/models/User');
jest.mock('../../../src/services/payment.service');

describe('User Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest({
      user: { id: 'user-id', _id: 'user-id', email: 'user@example.com' } as any,
    });
    mockResponse = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = createTestUser({
        _id: 'user-id',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: UserRole.USER,
        driverLicense: {
          number: 'DL123456',
          expiryDate: new Date('2025-12-01'),
        },
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expectSuccessResponse(mockResponse, mockUser);
    });

    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await userController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'User not found');
    });

    it('should return 400 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await userController.getProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Unauthorized');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        phone: '+9876543210',
        driverLicense: {
          number: 'DL789012',
          expiryDate: '2026-06-01',
        },
      };
      mockRequest.body = updateData;

      const mockUser = {
        _id: 'user-id',
        email: 'user@example.com',
        phone: '+1234567890',
        profile: {},
        save: jest.fn().mockResolvedValue(undefined),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.updateProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(mockUser.phone).toBe('+9876543210');
      expect(mockUser.save).toHaveBeenCalled();
      expectSuccessResponse(mockResponse, mockUser);
    });

    it('should validate driver license expiry date', async () => {
      mockRequest.body = {
        driverLicense: {
          number: 'DL123456',
          expiryDate: '2020-01-01', // Expired
        },
      };

      const mockUser = {
        _id: 'user-id',
        profile: {},
        save: jest.fn(),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.updateProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Driver license has expired');
    });

    it('should ignore email updates (not in implementation)', async () => {
      mockRequest.body = {
        email: 'newemail@example.com',
        phone: '+9876543210',
      };

      const mockUser = {
        _id: 'user-id',
        email: 'user@example.com', // Original email stays
        phone: '+1234567890',
        profile: {},
        save: jest.fn().mockResolvedValue(undefined),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.updateProfile(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUser.phone).toBe('+9876543210'); // Phone updated
      expect(mockUser.email).toBe('user@example.com'); // Email unchanged
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('setupPayoutAccount', () => {
    it('should setup payout account for business owner', async () => {
      const payoutData = {
        bankCode: '012',
        accountNumber: '1234567890',
      };
      mockRequest.body = payoutData;
      mockRequest.user = {
        id: 'owner-id',
        _id: 'owner-id',
        email: 'owner@example.com',
        role: UserRole.BUSINESS_OWNER,
      } as any;

      const mockUser = {
        _id: 'owner-id',
        email: 'owner@example.com',
        profile: {
          businessName: 'Test Business',
        },
        save: jest.fn().mockResolvedValue(undefined),
      } as any;

      const verifyResponse = {
        account_name: 'Test Business',
        account_number: '1234567890',
      };

      const subaccountResponse = {
        subaccount_code: 'ACCT_test123',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.verifyAccountNumber as jest.Mock).mockResolvedValue(verifyResponse);
      (paymentService.createSubaccount as jest.Mock).mockResolvedValue(subaccountResponse);

      await userController.setupPayoutAccount(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.verifyAccountNumber).toHaveBeenCalledWith(
        '1234567890',
        '012'
      );
      expect(paymentService.createSubaccount).toHaveBeenCalledWith({
        businessName: 'Test Business',
        bankCode: '012',
        accountNumber: '1234567890',
        percentageCharge: 6,
      });
      expect(mockUser.save).toHaveBeenCalled();
      expectSuccessResponse(mockResponse);
    });

    it('should fail if account verification fails', async () => {
      mockRequest.body = {
        bankCode: '012',
        accountNumber: '0000000000', // Invalid
      };
      mockRequest.user = {
        id: 'owner-id',
        _id: new Types.ObjectId(),
        email: 'owner@example.com',
        role: UserRole.BUSINESS_OWNER,
      } as any;

      const mockUser = {
        _id: 'owner-id',
        profile: { businessName: 'Test Business' },
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.verifyAccountNumber as jest.Mock).mockRejectedValue(
        new Error('Invalid account number')
      );

      await userController.setupPayoutAccount(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.verifyAccountNumber).toHaveBeenCalledWith(
        '0000000000',
        '012'
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });

    it('should work for any user (no role restriction in implementation)', async () => {
      mockRequest.body = {
        bankCode: '012',
        accountNumber: '1234567890',
      };
      mockRequest.user = {
        id: 'user-id',
        _id: 'user-id',
        email: 'user@example.com',
        role: UserRole.USER,
      } as any;

      const mockUser = {
        _id: 'user-id',
        email: 'user@example.com',
        profile: {},
        save: jest.fn().mockResolvedValue(undefined),
      };

      const verifyResponse = { account_name: 'John Doe' };
      const subaccountResponse = { subaccount_code: 'ACCT_test123' };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.verifyAccountNumber as jest.Mock).mockResolvedValue(verifyResponse);
      (paymentService.createSubaccount as jest.Mock).mockResolvedValue(subaccountResponse);

      await userController.setupPayoutAccount(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.createSubaccount).toHaveBeenCalledWith({
        businessName: 'user@example.com', // Falls back to email
        bankCode: '012',
        accountNumber: '1234567890',
        percentageCharge: 6,
      });
      expectSuccessResponse(mockResponse);
    });

    it('should allow updating payout account (no restriction in implementation)', async () => {
      mockRequest.body = {
        bankCode: '012',
        accountNumber: '1234567890',
      };
      mockRequest.user = {
        id: 'owner-id',
        _id: new Types.ObjectId(),
        email: 'owner@example.com',
        role: UserRole.BUSINESS_OWNER,
      } as any;

      const mockUser = {
        _id: 'owner-id',
        profile: {
          paystackSubaccountCode: 'ACCT_existing', // Already has subaccount
          businessName: 'Test Business',
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      const verifyResponse = { account_name: 'Test Business' };
      const subaccountResponse = { subaccount_code: 'ACCT_new123' };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.verifyAccountNumber as jest.Mock).mockResolvedValue(verifyResponse);
      (paymentService.createSubaccount as jest.Mock).mockResolvedValue(subaccountResponse);

      await userController.setupPayoutAccount(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockUser.save).toHaveBeenCalled();
      expectSuccessResponse(mockResponse);
    });
  });

  describe('getBanks', () => {
    it('should return list of banks', async () => {
      const mockBanks = {
        status: true,
        data: [
          { name: 'Test Bank', code: '012', active: true },
          { name: 'Another Bank', code: '013', active: true },
        ],
      };

      (paymentService.listBanks as jest.Mock).mockResolvedValue(mockBanks);

      await userController.getBanks(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.listBanks).toHaveBeenCalled();
      expectSuccessResponse(mockResponse, mockBanks); // Returns the whole response
    });

    it('should handle bank list failure', async () => {
      (paymentService.listBanks as jest.Mock).mockRejectedValue(
        new Error('Unable to fetch banks')
      );

      await userController.getBanks(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });

    it('should work without authentication (no auth check in getBanks)', async () => {
      mockRequest.user = undefined;

      const mockBanks = {
        status: true,
        data: [{ name: 'Test Bank', code: '012' }],
      };

      (paymentService.listBanks as jest.Mock).mockResolvedValue(mockBanks);

      await userController.getBanks(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.listBanks).toHaveBeenCalled();
      expectSuccessResponse(mockResponse, mockBanks);
    });
  });
});
