import { Response, NextFunction } from 'express';
import * as carController from '../../../src/controllers/car.controller';
import Car from '../../../src/models/Car';
import Reservation from '../../../src/models/Reservation';
import geocodingService from '../../../src/services/geocoding.service';
import { AuthRequest } from '../../../src/types';
import { 
  createTestCar, 
  createTestUser,
  createMockRequest, 
  createMockResponse, 
  expectErrorWithStatus,
  expectSuccessResponse,
  expectCreatedResponse 
} from '../../helpers/test-utils';

// Mock the models and services
jest.mock('../../../src/models/Car');
jest.mock('../../../src/models/Reservation');
jest.mock('../../../src/services/geocoding.service');

describe('Car Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCars', () => {
    it('should get all available cars', async () => {
      const mockCars = [
        { ...createTestCar(), _id: 'car-1', toObject: () => createTestCar({ _id: 'car-1' }) },
        { ...createTestCar(), _id: 'car-2', toObject: () => createTestCar({ _id: 'car-2' }) },
      ];

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockCars),
      };

      (Car.find as jest.Mock).mockReturnValue(mockQuery);
      (Car.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(2);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await carController.getCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.find).toHaveBeenCalledWith({ 'availability.status': 'available' });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            cars: expect.any(Array),
            pagination: expect.any(Object),
          }),
        })
      );
    });

    it('should filter cars by make', async () => {
      mockRequest.query = { make: 'Toyota' };
      
      const mockCars = [{ ...createTestCar({ make: 'Toyota' }), toObject: () => createTestCar({ make: 'Toyota' }) }];
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockCars),
      };

      (Car.find as jest.Mock).mockReturnValue(mockQuery);
      (Car.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await carController.getCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.find).toHaveBeenCalledWith({
        'availability.status': 'available',
        make: expect.any(RegExp),
      });
    });

    it('should filter cars by price range', async () => {
      mockRequest.query = { minPrice: '50', maxPrice: '100' };
      
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };

      (Car.find as jest.Mock).mockReturnValue(mockQuery);
      (Car.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await carController.getCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.find).toHaveBeenCalledWith({
        'availability.status': 'available',
        rentalPricePerDay: { $gte: 50, $lte: 100 },
      });
    });

    it('should filter cars by type', async () => {
      mockRequest.query = { type: 'sedan' };
      
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };

      (Car.find as jest.Mock).mockReturnValue(mockQuery);
      (Car.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await carController.getCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.find).toHaveBeenCalledWith({
        'availability.status': 'available',
        type: 'sedan',
      });
    });
  });

  describe('getCarById', () => {
    it('should get car by id', async () => {
      const mockCar = createTestCar();
      mockRequest.params = { id: 'car-id' };

      (Car.findById as jest.Mock).mockResolvedValue(mockCar);

      await carController.getCarById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.findById).toHaveBeenCalledWith('car-id');
      expectSuccessResponse(mockResponse, mockCar);
    });

    it('should return 404 if car not found', async () => {
      mockRequest.params = { id: 'nonexistent-id' };

      (Car.findById as jest.Mock).mockResolvedValue(null);

      await carController.getCarById(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Car not found');
    });
  });

  describe('createCar', () => {
    it('should create new car with geocoding', async () => {
      const carData = {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        type: 'sedan',
        licensePlate: 'XYZ789',
        rentalPricePerDay: 50,
        location: {
          address: '123 Main St',
          city: 'Lagos',
          state: 'Lagos',
        },
      };
      
      mockRequest.body = carData;
      mockRequest.user = createTestUser({ 
        _id: 'owner-id',
        id: 'owner-id',
      }) as any;

      const mockCar = { ...carData, _id: 'new-car-id', ownerId: 'owner-id' };
      (Car.create as jest.Mock).mockResolvedValue(mockCar);
      (geocodingService.getCoordinatesFromAddress as jest.Mock).mockResolvedValue({
        lat: 6.5244,
        lng: 3.3792,
      });

      await carController.createCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(geocodingService.getCoordinatesFromAddress).toHaveBeenCalledWith(
        carData.location.address,
        carData.location.city,
        carData.location.state
      );
      expect(Car.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...carData,
          ownerId: 'owner-id',
          location: expect.objectContaining({
            coordinates: { lat: 6.5244, lng: 3.3792 },
          }),
        })
      );
      expectCreatedResponse(mockResponse);
    });

    it('should create new car without location', async () => {
      const carData = {
        make: 'Honda',
        model: 'Accord',
        year: 2023,
        type: 'sedan',
        licensePlate: 'ABC456',
        rentalPricePerDay: 60,
      };
      
      mockRequest.body = carData;
      mockRequest.user = createTestUser({ id: 'owner-id' }) as any;

      const mockCar = { ...carData, _id: 'new-car-id', ownerId: 'owner-id' };
      (Car.create as jest.Mock).mockResolvedValue(mockCar);

      await carController.createCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...carData,
          ownerId: 'owner-id',
        })
      );
      expectCreatedResponse(mockResponse);
    });

    it('should fail if user is not authenticated', async () => {
      mockRequest.body = createTestCar();
      mockRequest.user = undefined;

      await carController.createCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 403);
    });
  });

  describe('updateCar', () => {
    it('should update car by owner', async () => {
      const updateData = { rentalPricePerDay: 60 };
      mockRequest.params = { id: 'car-id' };
      mockRequest.body = updateData;
      mockRequest.user = createTestUser({ _id: 'owner-id', id: 'owner-id' }) as any;

      const mockCar = createTestCar({ ownerId: 'owner-id' });
      const updatedCar = { ...mockCar, ...updateData };

      (Car.findById as jest.Mock).mockResolvedValue(mockCar);
      (Car.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedCar);

      await carController.updateCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.findByIdAndUpdate).toHaveBeenCalledWith(
        'car-id',
        updateData,
        { new: true, runValidators: true }
      );
      expectSuccessResponse(mockResponse);
    });

    it('should fail if user is not car owner', async () => {
      mockRequest.params = { id: 'car-id' };
      mockRequest.body = { rentalPricePerDay: 60 };
      mockRequest.user = createTestUser({ _id: 'different-user', id: 'different-user' }) as any;

      const mockCar = createTestCar({ ownerId: 'owner-id' });
      (Car.findById as jest.Mock).mockResolvedValue(mockCar);

      await carController.updateCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 403, 'Access forbidden');
    });
  });

  describe('deleteCar', () => {
    it('should delete car by owner', async () => {
      mockRequest.params = { id: 'car-id' };
      mockRequest.user = createTestUser({ _id: 'owner-id', id: 'owner-id' }) as any;

      const mockCar = createTestCar({ ownerId: 'owner-id', images: [] });
      (Car.findById as jest.Mock).mockResolvedValue(mockCar);
      (Car.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCar);

      await carController.deleteCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Car.findByIdAndDelete).toHaveBeenCalledWith('car-id');
      expectSuccessResponse(mockResponse);
    });

    it('should fail if user is not car owner', async () => {
      mockRequest.params = { id: 'car-id' };
      mockRequest.user = createTestUser({ _id: 'different-user', id: 'different-user' }) as any;

      const mockCar = createTestCar({ ownerId: 'owner-id' });
      (Car.findById as jest.Mock).mockResolvedValue(mockCar);

      await carController.deleteCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 403, 'Access forbidden');
    });

    it('should return 404 if car not found', async () => {
      mockRequest.params = { id: 'nonexistent-id' };
      mockRequest.user = createTestUser({ id: 'user-id' }) as any;

      (Car.findById as jest.Mock).mockResolvedValue(null);

      await carController.deleteCar(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Car not found');
    });
  });

  describe('getRecommendedCars', () => {
    it('should get popular cars from reservations', async () => {
      const popularCarIds = [
        { _id: 'car-1', count: 10 },
        { _id: 'car-2', count: 8 },
      ];

      const mockCars = [
        { ...createTestCar({ _id: 'car-1' }), toObject: () => createTestCar({ _id: 'car-1' }) },
        { ...createTestCar({ _id: 'car-2' }), toObject: () => createTestCar({ _id: 'car-2' }) },
      ];

      (Reservation.aggregate as jest.Mock) = jest.fn().mockResolvedValue(popularCarIds);
      (Car.findById as jest.Mock)
        .mockResolvedValueOnce(mockCars[0])
        .mockResolvedValueOnce(mockCars[1]);
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      await carController.getRecommendedCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Reservation.aggregate).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            popular: expect.any(Array),
            recommended: expect.any(Array),
          }),
        })
      );
    });

    it('should get recommended cars based on user preferences', async () => {
      mockRequest.user = createTestUser({ id: 'user-id' }) as any;

      const userReservations = [
        { carId: createTestCar({ type: 'sedan' }) },
        { carId: createTestCar({ type: 'sedan' }) },
      ];

      const mockQuery = {
        limit: jest.fn().mockResolvedValue([]),
      };

      (Reservation.find as jest.Mock)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(userReservations),
        })
        .mockResolvedValue([]);
      (Reservation.aggregate as jest.Mock) = jest.fn().mockResolvedValue([]);
      (Car.find as jest.Mock).mockReturnValue(mockQuery);

      await carController.getRecommendedCars(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            popular: expect.any(Array),
            recommended: expect.any(Array),
            preferredTypes: expect.any(Array),
          }),
        })
      );
    });
  });
});
