import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';
import axios from '@/lib/axios';
import { mockAuthResponse, mockUser } from '../mocks/mockData';

vi.mock('@/lib/axios');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and return auth response', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { data: mockAuthResponse } };
      
      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(axios.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw error on failed login', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      vi.mocked(axios.post).mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        phone: '+2341234567890',
      };
      const mockResponse = { data: { data: mockAuthResponse } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(axios.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockResponse = { data: { data: mockUser } };
      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(axios.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'refresh-token-123';
      const mockResponse = { data: { data: mockAuthResponse } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await authService.refreshToken(refreshToken);

      expect(axios.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken });
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should logout and clear local storage', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(axios.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should clear local storage even if API call fails', async () => {
      localStorage.setItem('token', 'test-token');
      vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('sendOTP', () => {
    it('should send OTP for registration', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.sendOTP('test@example.com', 'registration');

      expect(axios.post).toHaveBeenCalledWith('/auth/send-otp', {
        email: 'test@example.com',
        type: 'registration',
      });
    });

    it('should send OTP for forgot password', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.sendOTP('test@example.com', 'forgot-password');

      expect(axios.post).toHaveBeenCalledWith('/auth/send-otp', {
        email: 'test@example.com',
        type: 'forgot-password',
      });
    });
  });

  describe('verifyOTPAndRegister', () => {
    it('should verify OTP and register user', async () => {
      const mockResponse = { data: { data: mockAuthResponse } };
      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await authService.verifyOTPAndRegister(
        'test@example.com',
        '123456',
        'password123'
      );

      expect(axios.post).toHaveBeenCalledWith('/auth/verify-otp', {
        email: 'test@example.com',
        code: '123456',
        password: 'password123',
        role: undefined,
        phone: undefined,
        businessName: undefined,
      });
      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('token')).toBe(mockAuthResponse.token);
      expect(localStorage.getItem('refreshToken')).toBe(mockAuthResponse.refreshToken);
    });

    it('should verify OTP with business details', async () => {
      const mockResponse = { data: { data: mockAuthResponse } };
      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await authService.verifyOTPAndRegister(
        'owner@example.com',
        '123456',
        'password123',
        'business_owner',
        '+2341234567890',
        'My Car Rentals'
      );

      expect(axios.post).toHaveBeenCalledWith('/auth/verify-otp', {
        email: 'owner@example.com',
        code: '123456',
        password: 'password123',
        role: 'business_owner',
        phone: '+2341234567890',
        businessName: 'My Car Rentals',
      });
    });
  });

  describe('resendOTP', () => {
    it('should resend OTP', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.resendOTP('test@example.com', 'registration');

      expect(axios.post).toHaveBeenCalledWith('/auth/resend-otp', {
        email: 'test@example.com',
        type: 'registration',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.forgotPassword('test@example.com');

      expect(axios.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with code', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.resetPassword('test@example.com', '123456', 'newpassword123');

      expect(axios.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newpassword123',
      });
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await authService.changePassword('oldpassword', 'newpassword');

      expect(axios.post).toHaveBeenCalledWith('/users/change-password', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      });
    });
  });
});

