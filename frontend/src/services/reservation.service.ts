import axios from '@/lib/axios';
import { IReservation, ApiResponse, IGuestInfo } from '@/types';

interface SoftReserveData {
  carId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  guestInfo: IGuestInfo;
  driverLicense: {
    number: string;
    expiryDate: string;
  };
}

interface FirmReserveData {
  carId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

export const reservationService = {
  async createSoftReservation(data: SoftReserveData): Promise<IReservation> {
    const { data: response } = await axios.post<ApiResponse<IReservation>>(
      '/reservations/soft-reserve',
      data
    );
    return response.data!;
  },

  async createFirmReservation(data: FirmReserveData): Promise<IReservation> {
    const { data: response } = await axios.post<ApiResponse<IReservation>>(
      '/reservations/firm-reserve',
      data
    );
    return response.data!;
  },

  async convertSoftReservation(reservationId: string): Promise<IReservation> {
    const { data } = await axios.post<ApiResponse<IReservation>>(
      '/reservations/convert-soft-reserve',
      { reservationId }
    );
    return data.data!;
  },

  async getMyReservations(): Promise<IReservation[]> {
    const { data } = await axios.get<ApiResponse<IReservation[]>>(
      '/reservations/my-reservations'
    );
    return data.data!;
  },

  async updateReservation(
    id: string,
    updates: { startDate: string; endDate: string }
  ): Promise<IReservation> {
    const { data } = await axios.put<ApiResponse<IReservation>>(
      `/reservations/${id}`,
      updates
    );
    return data.data!;
  },

  async cancelReservation(id: string): Promise<void> {
    await axios.delete(`/reservations/${id}`);
  },

  async rateReservation(
    id: string,
    rating: { stars: number; review?: string }
  ): Promise<IReservation> {
    const { data } = await axios.post<ApiResponse<IReservation>>(
      `/reservations/${id}/rate`,
      rating
    );
    return data.data!;
  },

  async markAsPickedUp(
    id: string,
    location?: { latitude: number; longitude: number; address?: string }
  ): Promise<IReservation> {
    const { data } = await axios.post<ApiResponse<IReservation>>(
      `/reservations/${id}/pickup`,
      location || {}
    );
    return data.data!;
  },

  async markAsReturned(
    id: string,
    location?: { latitude: number; longitude: number; address?: string }
  ): Promise<IReservation> {
    const { data } = await axios.post<ApiResponse<IReservation>>(
      `/reservations/${id}/return`,
      location || {}
    );
    return data.data!;
  },
};

