import { Response, NextFunction } from 'express';
import * as reservationController from '../../../src/controllers/reservation.controller';
import Reservation from '../../../src/models/Reservation';
import Car from '../../../src/models/Car';
import User from '../../../src/models/User';
import { AuthRequest } from '../../../src/types';
import { ReservationStatus } from '../../../src/utils/constants';
import { 
  createTestReservation,
  createTestCar,
  createTestUser,
  createMockRequest, 
  createMockResponse, 
  expectErrorWithStatus,
  expectSuccessResponse,
  expectCreatedResponse,
  getFutureDate,
  getPastDate
} from '../../helpers/test-utils';

// Mock the models and services
jest.mock('../../../src/models/Reservation');
jest.mock('../../../src/models/Car');
jest.mock('../../../src/models/User');
jest.mock('../../../src/services/email.service');

describe('Reservation Controller', () => {
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

  describe('createFirmReservation', () => {
    it('should create firm reservation for authenticated user', async () => {
      const reservationData = {
        carId: 'car-id',
        startDate: getFutureDate(1).toISOString(),
        endDate: getFutureDate(3).toISOString(),
      };
      mockRequest.body = reservationData;

      const mockUser = createTestUser({
        id: 'user-id',
        profile: {
          driverLicense: {
            number: 'DL123456',
            expiryDate: getFutureDate(365).toISOString(),
          },
        },
      });

      const mockCar = createTestCar({
        _id: 'car-id',
        rentalPricePerDay: 100,
      });

      const mockReservation = createTestReservation({
        ...reservationData,
        userId: 'user-id',
        status: ReservationStatus.CONFIRMED,
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Car.findById as jest.Mock).mockResolvedValue(mockCar);
      (Reservation.find as jest.Mock).mockResolvedValue([]); // No conflicts
      (Reservation.create as jest.Mock).mockResolvedValue(mockReservation);

      await reservationController.createFirmReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(Car.findById).toHaveBeenCalledWith('car-id');
      expectCreatedResponse(mockResponse);
    });

    it('should fail if car is not available for selected dates', async () => {
      const reservationData = {
        carId: 'car-id',
        startDate: getFutureDate(1).toISOString(),
        endDate: getFutureDate(3).toISOString(),
      };
      mockRequest.body = reservationData;

      const mockUser = createTestUser({
        id: 'user-id',
        profile: {
          driverLicense: {
            number: 'DL123456',
            expiryDate: getFutureDate(365).toISOString(),
          },
        },
      });

      const mockCar = createTestCar({ _id: 'car-id' });
      const conflictingReservation = createTestReservation({
        carId: 'car-id',
        startDate: getFutureDate(2),
        endDate: getFutureDate(4),
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Car.findById as jest.Mock).mockResolvedValue(mockCar);
      (Reservation.find as jest.Mock).mockResolvedValue([conflictingReservation]);

      await reservationController.createFirmReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 409, 'Car already reserved for selected dates');
    });

    it('should fail if car does not exist', async () => {
      mockRequest.body = {
        carId: 'nonexistent-car',
        startDate: getFutureDate(1).toISOString(),
        endDate: getFutureDate(3).toISOString(),
      };

      const mockUser = createTestUser({
        id: 'user-id',
        profile: {
          driverLicense: {
            number: 'DL123456',
            expiryDate: getFutureDate(365).toISOString(),
          },
        },
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Car.findById as jest.Mock).mockResolvedValue(null);

      await reservationController.createFirmReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Car not found');
    });

    it('should fail if user has no driver license', async () => {
      mockRequest.body = {
        carId: 'car-id',
        startDate: getFutureDate(1).toISOString(),
        endDate: getFutureDate(3).toISOString(),
      };

      const mockUser = createTestUser({
        id: 'user-id',
        profile: {},
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await reservationController.createFirmReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'driver license');
    });

    it('should fail if end date is before start date', async () => {
      mockRequest.body = {
        carId: 'car-id',
        startDate: getFutureDate(3).toISOString(),
        endDate: getFutureDate(1).toISOString(),
      };

      const mockUser = createTestUser({
        id: 'user-id',
        profile: {
          driverLicense: {
            number: 'DL123456',
            expiryDate: getFutureDate(365).toISOString(),
          },
        },
      });

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await reservationController.createFirmReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Invalid reservation dates');
    });
  });

  describe('createSoftReservation', () => {
    it('should create soft reservation for guest user', async () => {
      const reservationData = {
        carId: 'car-id',
        startDate: getFutureDate(1).toISOString(),
        endDate: getFutureDate(3).toISOString(),
        guestInfo: {
          email: 'guest@example.com',
          phone: '+1234567890',
          firstName: 'Guest',
          lastName: 'User',
        },
        driverLicense: {
          number: 'DL123456',
          expiryDate: getFutureDate(365).toISOString(),
        },
      };
      mockRequest.body = reservationData;
      mockRequest.user = undefined; // Guest user

      const mockCar = createTestCar({ _id: 'car-id', rentalPricePerDay: 100 });
      const mockReservation = createTestReservation({
        carId: 'car-id',
        startDate: getFutureDate(1),
        endDate: getFutureDate(3),
        status: ReservationStatus.PENDING,
      });

      (Car.findById as jest.Mock).mockResolvedValue(mockCar);
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Reservation.create as jest.Mock).mockResolvedValue(mockReservation);

      await reservationController.createSoftReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectCreatedResponse(mockResponse);
    });

    it('should fail if driver license is expired', async () => {
      const reservationData = {
        carId: 'car-id',
        startDate: getFutureDate(1).toISOString(),
        endDate: getFutureDate(3).toISOString(),
        guestInfo: {
          email: 'guest@example.com',
          firstName: 'Guest',
          lastName: 'User',
        },
        driverLicense: {
          number: 'DL123456',
          expiryDate: getPastDate(30).toISOString(),
        },
      };
      mockRequest.body = reservationData;

      await reservationController.createSoftReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Driver license has expired');
    });
  });

  describe('getMyReservations', () => {
    it('should return user reservations', async () => {
      const mockReservations = [
        createTestReservation({ userId: 'user-id', status: ReservationStatus.CONFIRMED }),
        createTestReservation({ userId: 'user-id', status: ReservationStatus.PENDING }),
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReservations),
      };

      (Reservation.find as jest.Mock).mockReturnValue(mockQuery);

      await reservationController.getMyReservations(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Reservation.find).toHaveBeenCalledWith({ userId: 'user-id' });
      expect(mockQuery.populate).toHaveBeenCalledWith('carId');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expectSuccessResponse(mockResponse, mockReservations);
    });

    it('should return empty array if no reservations found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };

      (Reservation.find as jest.Mock).mockReturnValue(mockQuery);

      await reservationController.getMyReservations(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectSuccessResponse(mockResponse, []);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', async () => {
      mockRequest.params = { id: 'reservation-id' };
      
      const mockReservation = {
        _id: 'reservation-id',
        userId: 'user-id',
        carId: 'car-id',
        status: ReservationStatus.CONFIRMED,
        startDate: getFutureDate(5),
        endDate: getFutureDate(7),
        totalPrice: 200,
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockCar = createTestCar({ _id: 'car-id' });

      (Reservation.findById as jest.Mock).mockResolvedValue(mockReservation);
      (Car.findById as jest.Mock).mockResolvedValue(mockCar);

      await reservationController.cancelReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockReservation.status).toBe(ReservationStatus.CANCELLED);
      expect(mockReservation.save).toHaveBeenCalled();
      expectSuccessResponse(mockResponse);
    });

    it('should fail if reservation not found', async () => {
      mockRequest.params = { id: 'nonexistent-id' };

      (Reservation.findById as jest.Mock).mockResolvedValue(null);

      await reservationController.cancelReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Reservation not found');
    });

    it('should fail if user is not reservation owner', async () => {
      mockRequest.params = { id: 'reservation-id' };
      
      const mockReservation = {
        _id: 'reservation-id',
        userId: 'different-user-id',
        status: ReservationStatus.CONFIRMED,
        startDate: getFutureDate(5),
      };

      (Reservation.findById as jest.Mock).mockResolvedValue(mockReservation);

      await reservationController.cancelReservation(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Cannot modify this reservation');
    });
  });
});
