import { Response, NextFunction } from 'express';
import * as paymentController from '../../../src/controllers/payment.controller';
import Payment from '../../../src/models/Payment';
import Reservation from '../../../src/models/Reservation';
import User from '../../../src/models/User';
import paymentService from '../../../src/services/payment.service';
import { AuthRequest } from '../../../src/types';
import { PaymentType } from '../../../src/utils/constants';
import { 
  createTestPayment,
  createTestReservation,
  createTestUser,
  createMockRequest, 
  createMockResponse, 
  expectErrorWithStatus,
  expectSuccessResponse
} from '../../helpers/test-utils';

// Mock the models and services
jest.mock('../../../src/models/Payment');
jest.mock('../../../src/models/Reservation');
jest.mock('../../../src/models/User');
jest.mock('../../../src/services/payment.service');

describe('Payment Controller', () => {
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

  describe('initializePayment', () => {
    it('should initialize payment for authenticated user', async () => {
      const paymentData = {
        reservationId: 'reservation-id',
        amount: 10000, // 100 NGN in kobo
        type: PaymentType.FULL_PAYMENT,
      };
      mockRequest.body = paymentData;

      const mockReservation = createTestReservation({
        _id: 'reservation-id',
        userId: 'user-id',
        carId: {
          _id: 'car-id',
          ownerId: 'owner-id',
        },
        totalPrice: 100,
      });

      const mockUser = createTestUser({
        _id: 'user-id',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const initializeResponse = {
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test-transaction',
          access_code: 'test-access-code',
          reference: 'test-reference-123',
        },
      };

      const mockPayment = createTestPayment({
        reservationId: 'reservation-id',
        userId: 'user-id',
        amount: 10000,
        type: PaymentType.FULL_PAYMENT,
        paystackReference: 'test-reference-123',
        status: 'pending',
      });

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (paymentService.initializeTransaction as jest.Mock).mockResolvedValue(initializeResponse);
      (Payment.create as jest.Mock).mockResolvedValue(mockPayment);

      await paymentController.initializePayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.initializeTransaction).toHaveBeenCalledWith(
        'user@example.com',
        10000,
        expect.any(Object),
        undefined
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should initialize payment with subaccount for business owner', async () => {
      const paymentData = {
        reservationId: 'reservation-id',
        amount: 10000,
        type: PaymentType.FULL_PAYMENT,
      };
      mockRequest.body = paymentData;

      const mockReservation = createTestReservation({
        _id: 'reservation-id',
        userId: 'user-id',
        carId: {
          _id: 'car-id',
          ownerId: 'owner-id',
        },
      });

      const mockUser = createTestUser({ email: 'user@example.com' });
      const mockOwner = createTestUser({
        _id: 'owner-id',
        paystackSubaccountCode: 'ACCT_test123',
      });

      const initializeResponse = {
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test-transaction',
          reference: 'test-reference-123',
        },
      };

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });
      (User.findById as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockOwner);
      (paymentService.initializeTransaction as jest.Mock).mockResolvedValue(initializeResponse);
      (Payment.create as jest.Mock).mockResolvedValue({});

      await paymentController.initializePayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should fail if reservation not found', async () => {
      mockRequest.body = {
        reservationId: 'nonexistent-id',
        amount: 10000,
        type: PaymentType.FULL_PAYMENT,
      };

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await paymentController.initializePayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Reservation not found');
    });

    it('should fail if user is not reservation owner', async () => {
      mockRequest.body = {
        reservationId: 'reservation-id',
        amount: 10000,
        type: PaymentType.FULL_PAYMENT,
      };

      const mockReservation = createTestReservation({
        userId: 'different-user-id', // Different user
      });

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });

      await paymentController.initializePayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Unauthorized to pay for this reservation');
    });

  });

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      mockRequest.params = { reference: 'test-reference-123' };

      const mockPayment = {
        ...createTestPayment({
          paystackReference: 'test-reference-123',
          status: 'pending',
          reservationId: 'reservation-id',
        }),
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockReservation = {
        ...createTestReservation({
          _id: 'reservation-id',
        }),
        save: jest.fn().mockResolvedValue(undefined),
      };

      const verifyResponse = {
        status: true,
        data: {
          status: 'success',
          amount: 10000,
          reference: 'test-reference-123',
        },
      };

      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockPayment);
      (Reservation.findById as jest.Mock).mockResolvedValue(mockReservation);
      (paymentService.verifyTransaction as jest.Mock).mockResolvedValue(verifyResponse);

      await paymentController.verifyPayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(paymentService.verifyTransaction).toHaveBeenCalledWith('test-reference-123');
      expectSuccessResponse(mockResponse);
    });

    it('should handle failed payment verification', async () => {
      mockRequest.params = { reference: 'test-reference-123' };

      const mockPayment = {
        ...createTestPayment({
          paystackReference: 'test-reference-123',
          status: 'pending',
        }),
        save: jest.fn().mockResolvedValue(undefined),
      };

      const verifyResponse = {
        status: true,
        data: {
          status: 'failed',
          reference: 'test-reference-123',
        },
      };

      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockPayment);
      (paymentService.verifyTransaction as jest.Mock).mockResolvedValue(verifyResponse);

      await paymentController.verifyPayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockPayment.status).toBe('failed');
      expect(mockPayment.save).toHaveBeenCalled();
    });

    it('should fail if payment record not found', async () => {
      mockRequest.params = { reference: 'nonexistent-reference' };

      (Payment.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

      await paymentController.verifyPayment(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Payment not found');
    });
  });

});
