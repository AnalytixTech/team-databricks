import { Response, NextFunction } from 'express';
import * as dashboardController from '../../../src/controllers/dashboard.controller';
import Car from '../../../src/models/Car';
import Reservation from '../../../src/models/Reservation';
import { AuthRequest } from '../../../src/types';
import { ReservationStatus, UserRole } from '../../../src/utils/constants';
import { 
  createTestCar,
  createTestReservation,
  createMockRequest, 
  createMockResponse, 
  expectErrorWithStatus,
  expectSuccessResponse 
} from '../../helpers/test-utils';

// Mock the models
jest.mock('../../../src/models/Car');
jest.mock('../../../src/models/Reservation');

describe('Dashboard Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest({
      user: { id: 'owner-id', _id: 'owner-id', role: UserRole.BUSINESS_OWNER } as any,
    });
    mockResponse = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getOwnerCars', () => {
    it('should return cars owned by the current business owner', async () => {
      const mockCars = [
        createTestCar({ _id: 'car-1', ownerId: 'owner-id', make: 'Toyota' }),
        createTestCar({ _id: 'car-2', ownerId: 'owner-id', make: 'Honda' }),
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockCars),
      };

      (Car.find as jest.Mock).mockReturnValue(mockQuery);

      await dashboardController.getOwnerCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.find).toHaveBeenCalledWith({ ownerId: 'owner-id' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expectSuccessResponse(mockResponse, mockCars);
    });

    it('should return empty array if no cars found', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      (Car.find as jest.Mock).mockReturnValue(mockQuery);

      await dashboardController.getOwnerCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectSuccessResponse(mockResponse, []);
    });

    it('should return 400 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await dashboardController.getOwnerCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 400, 'Unauthorized');
    });

  });

  describe('getAllReservations', () => {
    it('should return all reservations for owned cars', async () => {
      const ownedCarIds = ['car-1', 'car-2'];
      const mockReservations = [
        createTestReservation({ _id: 'res-1', carId: 'car-1', status: ReservationStatus.PENDING }),
        createTestReservation({ _id: 'res-2', carId: 'car-2', status: ReservationStatus.CONFIRMED }),
      ];

      (Car.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(ownedCarIds),
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReservations),
      };

      (Reservation.find as jest.Mock).mockReturnValue(mockQuery);

      await dashboardController.getAllReservations(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.find).toHaveBeenCalledWith({ ownerId: 'owner-id' });
      expect(Reservation.find).toHaveBeenCalledWith({ carId: { $in: ownedCarIds } });
      expect(mockQuery.populate).toHaveBeenCalledWith('carId');
      expect(mockQuery.populate).toHaveBeenCalledWith('userId');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expectSuccessResponse(mockResponse, mockReservations);
    });

    it('should filter reservations by status', async () => {
      mockRequest.query = { status: ReservationStatus.CONFIRMED };
      
      const ownedCarIds = ['car-1'];
      (Car.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(ownedCarIds),
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };

      (Reservation.find as jest.Mock).mockReturnValue(mockQuery);

      await dashboardController.getAllReservations(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Reservation.find).toHaveBeenCalledWith({ 
        carId: { $in: ownedCarIds },
        status: ReservationStatus.CONFIRMED
      });
    });

    it('should return empty array if no cars owned', async () => {
      (Car.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      await dashboardController.getAllReservations(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectSuccessResponse(mockResponse, []);
    });
  });
});
