import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '@/services/user.service';
import axios from '@/lib/axios';
import { mockUser } from '../mocks/mockData';

vi.mock('@/lib/axios');

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch user profile', async () => {
      const mockResponse = { data: { data: mockUser } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await userService.getProfile();

      expect(axios.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update phone number', async () => {
      const updates = { phone: '+2349876543210' };
      const mockResponse = { data: { data: { ...mockUser, phone: updates.phone } } };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await userService.updateProfile(updates);

      expect(axios.put).toHaveBeenCalledWith('/users/profile', updates);
      expect(result.phone).toBe(updates.phone);
    });

    it('should update business name', async () => {
      const updates = { businessName: 'New Car Rentals' };
      const mockResponse = {
        data: {
          data: {
            ...mockUser,
            profile: { ...mockUser.profile, businessName: updates.businessName },
          },
        },
      };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await userService.updateProfile(updates);

      expect(axios.put).toHaveBeenCalledWith('/users/profile', updates);
      expect(result.profile.businessName).toBe(updates.businessName);
    });

    it('should update driver license', async () => {
      const updates = {
        driverLicense: {
          number: 'DL987654',
          expiryDate: '2026-12-31',
          state: 'Lagos',
        },
      };
      const mockResponse = {
        data: {
          data: {
            ...mockUser,
            profile: { ...mockUser.profile, driverLicense: updates.driverLicense },
          },
        },
      };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await userService.updateProfile(updates);

      expect(axios.put).toHaveBeenCalledWith('/users/profile', updates);
      expect(result.profile.driverLicense).toEqual(updates.driverLicense);
    });

    it('should update multiple fields', async () => {
      const updates = {
        phone: '+2349876543210',
        businessName: 'Updated Rentals',
      };
      const mockResponse = {
        data: {
          data: {
            ...mockUser,
            phone: updates.phone,
            profile: { ...mockUser.profile, businessName: updates.businessName },
          },
        },
      };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await userService.updateProfile(updates);

      expect(axios.put).toHaveBeenCalledWith('/users/profile', updates);
      expect(result.phone).toBe(updates.phone);
      expect(result.profile.businessName).toBe(updates.businessName);
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method', async () => {
      const paymentMethod = {
        type: 'card',
        authorization_code: 'AUTH_code123',
      };
      const mockResponse = {
        data: {
          data: {
            ...mockUser,
            profile: {
              ...mockUser.profile,
              savedPaymentMethods: [
                {
                  _id: 'pm123',
                  type: 'card',
                  last4: '1234',
                  authorization_code: 'AUTH_code123',
                },
              ],
            },
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await userService.addPaymentMethod(paymentMethod);

      expect(axios.post).toHaveBeenCalledWith('/users/payment-methods', paymentMethod);
      expect(result.profile.savedPaymentMethods).toHaveLength(1);
      expect(result.profile.savedPaymentMethods[0].type).toBe('card');
    });
  });

  describe('removePaymentMethod', () => {
    it('should remove payment method', async () => {
      vi.mocked(axios.delete).mockResolvedValue({ data: {} });

      await userService.removePaymentMethod('pm123');

      expect(axios.delete).toHaveBeenCalledWith('/users/payment-methods/pm123');
    });
  });
});

