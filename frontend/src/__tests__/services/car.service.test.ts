import { describe, it, expect, vi, beforeEach } from 'vitest';
import { carService } from '@/services/car.service';
import axios from '@/lib/axios';
import { mockCar } from '../mocks/mockData';
import { CarType } from '@/types';

vi.mock('@/lib/axios');

describe('carService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCars', () => {
    it('should fetch cars without filters', async () => {
      const mockResponse = {
        data: { data: { cars: [mockCar], total: 1, pages: 1 } },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await carService.getCars();

      expect(axios.get).toHaveBeenCalledWith('/cars', { params: undefined });
      expect(result.cars).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should fetch cars with filters', async () => {
      const filters = {
        make: 'Toyota',
        type: CarType.SEDAN,
        minPrice: 20000,
        maxPrice: 50000,
        startDate: '2024-02-01',
        endDate: '2024-02-05',
      };
      const mockResponse = {
        data: { data: { cars: [mockCar], total: 1, pages: 1 } },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await carService.getCars(filters);

      expect(axios.get).toHaveBeenCalledWith('/cars', { params: filters });
      expect(result.cars).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const filters = { page: 2, limit: 10 };
      const mockResponse = {
        data: { data: { cars: [mockCar], total: 15, pages: 2 } },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await carService.getCars(filters);

      expect(axios.get).toHaveBeenCalledWith('/cars', { params: filters });
      expect(result.pages).toBe(2);
    });
  });

  describe('getCarById', () => {
    it('should fetch car by ID', async () => {
      const mockResponse = { data: { data: mockCar } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await carService.getCarById('car123');

      expect(axios.get).toHaveBeenCalledWith('/cars/car123');
      expect(result).toEqual(mockCar);
    });

    it('should throw error for non-existent car', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Car not found'));

      await expect(carService.getCarById('nonexistent')).rejects.toThrow('Car not found');
    });
  });

  describe('createCar', () => {
    it('should create new car', async () => {
      const carData = {
        make: 'Honda',
        model: 'Accord',
        type: CarType.SEDAN,
        year: 2023,
        licensePlate: 'XYZ789',
        rentalPricePerDay: 30000,
      };
      const mockResponse = { data: { data: { ...mockCar, ...carData } } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await carService.createCar(carData);

      expect(axios.post).toHaveBeenCalledWith('/cars', carData);
      expect(result.make).toBe(carData.make);
    });
  });

  describe('updateCar', () => {
    it('should update car details', async () => {
      const updates = { rentalPricePerDay: 35000, mileage: 20000 };
      const mockResponse = { data: { data: { ...mockCar, ...updates } } };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await carService.updateCar('car123', updates);

      expect(axios.put).toHaveBeenCalledWith('/cars/car123', updates);
      expect(result.rentalPricePerDay).toBe(35000);
    });
  });

  describe('deleteCar', () => {
    it('should delete car', async () => {
      vi.mocked(axios.delete).mockResolvedValue({ data: {} });

      await carService.deleteCar('car123');

      expect(axios.delete).toHaveBeenCalledWith('/cars/car123');
    });
  });

  describe('uploadCarImages', () => {
    it('should upload car images', async () => {
      const mockFile1 = new File(['image1'], 'car1.jpg', { type: 'image/jpeg' });
      const mockFile2 = new File(['image2'], 'car2.jpg', { type: 'image/jpeg' });
      const images = [mockFile1, mockFile2];
      const mockResponse = { data: { data: mockCar } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await carService.uploadCarImages('car123', images);

      expect(axios.post).toHaveBeenCalledWith(
        '/cars/car123/images',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      expect(result).toEqual(mockCar);
    });
  });

  describe('getRecommendations', () => {
    it('should fetch car recommendations', async () => {
      const mockRecommendations = {
        popular: [mockCar],
        recommended: [mockCar],
        preferredTypes: ['sedan', 'suv'],
      };
      const mockResponse = { data: { data: mockRecommendations } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await carService.getRecommendations();

      expect(axios.get).toHaveBeenCalledWith('/cars/recommendations/list');
      expect(result.popular).toHaveLength(1);
      expect(result.recommended).toHaveLength(1);
      expect(result.preferredTypes).toContain('sedan');
    });
  });
});

