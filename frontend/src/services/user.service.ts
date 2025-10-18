import axios from '@/lib/axios';
import { IUser, IPaymentMethod, ApiResponse } from '@/types';

interface UpdateProfileData {
  phone?: string;
  driverLicense?: {
    number: string;
    expiryDate: string;
    state: string;
  };
}

export const userService = {
  async getProfile(): Promise<IUser> {
    const { data } = await axios.get<ApiResponse<IUser>>('/users/profile');
    return data.data!;
  },

  async updateProfile(updates: UpdateProfileData): Promise<IUser> {
    const { data } = await axios.put<ApiResponse<IUser>>('/users/profile', updates);
    return data.data!;
  },

  async addPaymentMethod(paymentMethod: {
    type: string;
    authorization_code: string;
  }): Promise<IUser> {
    const { data } = await axios.post<ApiResponse<IUser>>(
      '/users/payment-methods',
      paymentMethod
    );
    return data.data!;
  },

  async removePaymentMethod(id: string): Promise<void> {
    await axios.delete(`/users/payment-methods/${id}`);
  },
};

