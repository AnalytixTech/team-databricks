import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reservationService } from '@/services/reservation.service';
import axios from '@/lib/axios';
import { mockReservation, mockSoftReservation } from '../mocks/mockData';

vi.mock('@/lib/axios');

describe('reservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSoftReservation', () => {
    it('should create soft reservation successfully', async () => {
      const softReserveData = {
        carId: 'car123',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        guestInfo: { email: 'guest@example.com', phone: '+2341234567890' },
        driverLicense: { number: 'DL123456', expiryDate: '2025-12-31' },
      };
      const mockResponse = { data: { data: mockSoftReservation } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.createSoftReservation(softReserveData);

      expect(axios.post).toHaveBeenCalledWith('/reservations/soft-reserve', softReserveData);
      expect(result).toEqual(mockSoftReservation);
    });
  });

  describe('createFirmReservation', () => {
    it('should create firm reservation successfully', async () => {
      const firmReserveData = {
        carId: 'car123',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
      };
      const mockResponse = { data: { data: mockReservation } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.createFirmReservation(firmReserveData);

      expect(axios.post).toHaveBeenCalledWith('/reservations/firm-reserve', firmReserveData);
      expect(result).toEqual(mockReservation);
    });

    it('should include optional time fields', async () => {
      const firmReserveData = {
        carId: 'car123',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        startTime: '10:00',
        endTime: '10:00',
      };
      const mockResponse = { data: { data: mockReservation } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await reservationService.createFirmReservation(firmReserveData);

      expect(axios.post).toHaveBeenCalledWith('/reservations/firm-reserve', firmReserveData);
    });
  });

  describe('convertSoftReservation', () => {
    it('should convert soft reservation to firm', async () => {
      const reservationId = 'soft-reservation123';
      const mockResponse = { data: { data: mockReservation } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.convertSoftReservation(reservationId);

      expect(axios.post).toHaveBeenCalledWith('/reservations/convert-soft-reserve', {
        reservationId,
      });
      expect(result).toEqual(mockReservation);
    });
  });

  describe('getMyReservations', () => {
    it('should fetch user reservations', async () => {
      const mockReservations = [mockReservation, mockSoftReservation];
      const mockResponse = { data: { data: mockReservations } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await reservationService.getMyReservations();

      expect(axios.get).toHaveBeenCalledWith('/reservations/my-reservations');
      expect(result).toEqual(mockReservations);
    });
  });

  describe('updateReservation', () => {
    it('should update reservation dates', async () => {
      const updates = {
        startDate: '2024-02-10',
        endDate: '2024-02-15',
      };
      const mockResponse = { data: { data: { ...mockReservation, ...updates } } };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await reservationService.updateReservation('reservation123', updates);

      expect(axios.put).toHaveBeenCalledWith('/reservations/reservation123', updates);
      expect(result.startDate).toBe(updates.startDate);
      expect(result.endDate).toBe(updates.endDate);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation', async () => {
      vi.mocked(axios.delete).mockResolvedValue({ data: {} });

      await reservationService.cancelReservation('reservation123');

      expect(axios.delete).toHaveBeenCalledWith('/reservations/reservation123');
    });
  });

  describe('rateReservation', () => {
    it('should rate reservation with stars only', async () => {
      const rating = { stars: 5 };
      const mockResponse = {
        data: { data: { ...mockReservation, rating: { ...rating, ratedAt: new Date().toISOString() } } },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.rateReservation('reservation123', rating);

      expect(axios.post).toHaveBeenCalledWith('/reservations/reservation123/rate', rating);
      expect(result.rating?.stars).toBe(5);
    });

    it('should rate reservation with stars and review', async () => {
      const rating = { stars: 4, review: 'Great car!' };
      const mockResponse = {
        data: { data: { ...mockReservation, rating: { ...rating, ratedAt: new Date().toISOString() } } },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.rateReservation('reservation123', rating);

      expect(axios.post).toHaveBeenCalledWith('/reservations/reservation123/rate', rating);
      expect(result.rating?.stars).toBe(4);
      expect(result.rating?.review).toBe('Great car!');
    });
  });

  describe('markAsPickedUp', () => {
    it('should mark reservation as picked up without location', async () => {
      const mockResponse = { data: { data: { ...mockReservation, pickedUpAt: new Date().toISOString() } } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.markAsPickedUp('reservation123');

      expect(axios.post).toHaveBeenCalledWith('/reservations/reservation123/pickup', {});
      expect(result.pickedUpAt).toBeDefined();
    });

    it('should mark reservation as picked up with location', async () => {
      const location = {
        latitude: 6.5244,
        longitude: 3.3792,
        address: '123 Test Street, Lagos',
      };
      const mockResponse = {
        data: {
          data: {
            ...mockReservation,
            pickedUpAt: new Date().toISOString(),
            pickupLocation: location,
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.markAsPickedUp('reservation123', location);

      expect(axios.post).toHaveBeenCalledWith('/reservations/reservation123/pickup', location);
      expect(result.pickupLocation).toEqual(location);
    });
  });

  describe('markAsReturned', () => {
    it('should mark reservation as returned without location', async () => {
      const mockResponse = { data: { data: { ...mockReservation, returnedAt: new Date().toISOString() } } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.markAsReturned('reservation123');

      expect(axios.post).toHaveBeenCalledWith('/reservations/reservation123/return', {});
      expect(result.returnedAt).toBeDefined();
    });

    it('should mark reservation as returned with location', async () => {
      const location = {
        latitude: 6.5244,
        longitude: 3.3792,
        address: '123 Test Street, Lagos',
      };
      const mockResponse = {
        data: {
          data: {
            ...mockReservation,
            returnedAt: new Date().toISOString(),
            returnLocation: location,
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await reservationService.markAsReturned('reservation123', location);

      expect(axios.post).toHaveBeenCalledWith('/reservations/reservation123/return', location);
      expect(result.returnLocation).toEqual(location);
    });
  });
});

