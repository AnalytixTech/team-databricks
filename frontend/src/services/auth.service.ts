import axios from '@/lib/axios';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  IUser,
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return data.data!;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      userData
    );
    return data.data!;
  },

  async getCurrentUser(): Promise<IUser> {
    const { data } = await axios.get<ApiResponse<IUser>>('/auth/me');
    return data.data!;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      '/auth/refresh',
      { refreshToken }
    );
    return data.data!;
  },

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await axios.post('/auth/logout');
    } catch (error) {
      // Even if backend call fails, still clear local storage
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async sendOTP(email: string, type: 'registration' | 'forgot-password'): Promise<void> {
    await axios.post('/auth/send-otp', { email, type });
  },

  async verifyOTPAndRegister(
    email: string,
    code: string,
    password: string,
    role?: string,
    phone?: string,
    businessName?: string
  ): Promise<AuthResponse> {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      '/auth/verify-otp',
      { email, code, password, role, phone, businessName }
    );
    
    // Store tokens
    if (data.data?.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    
    return data.data!;
  },

  async resendOTP(email: string, type: 'registration' | 'forgot-password'): Promise<void> {
    await axios.post('/auth/resend-otp', { email, type });
  },

  async forgotPassword(email: string): Promise<void> {
    await axios.post('/auth/forgot-password', { email });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await axios.post('/auth/reset-password', { email, code, newPassword });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axios.post('/users/change-password', { currentPassword, newPassword });
  },
};

