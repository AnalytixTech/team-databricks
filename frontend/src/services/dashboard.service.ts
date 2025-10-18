import axios from '@/lib/axios';
import { IReservation, DetailedReport, ICar, ApiResponse } from '@/types';

interface CreateReservationData {
  carId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  customerEmail: string;
  customerPhone: string;
  driverLicense: {
    number: string;
    expiryDate: string;
  };
}

export const dashboardService = {
  async getOwnerCars(): Promise<ICar[]> {
    const { data } = await axios.get<ApiResponse<ICar[]>>('/dashboard/cars');
    return data.data!;
  },

  async getAllReservations(): Promise<IReservation[]> {
    const { data } = await axios.get<ApiResponse<IReservation[]>>(
      '/dashboard/reservations'
    );
    return data.data!;
  },

  async createReservation(reservationData: CreateReservationData): Promise<IReservation> {
    const { data } = await axios.post<ApiResponse<IReservation>>(
      '/dashboard/reservations/create',
      reservationData
    );
    return data.data!;
  },

  async cancelReservation(id: string): Promise<IReservation> {
    const { data } = await axios.put<ApiResponse<IReservation>>(
      `/dashboard/reservations/${id}/cancel`
    );
    return data.data!;
  },

  async reassignReservation(id: string, newCarId: string): Promise<IReservation> {
    const { data } = await axios.put<ApiResponse<IReservation>>(
      `/dashboard/reservations/${id}/reassign`,
      { newCarId }
    );
    return data.data!;
  },

  async getReports(startDate?: string, endDate?: string): Promise<DetailedReport> {
    const { data } = await axios.get<ApiResponse<DetailedReport>>('/dashboard/reports', {
      params: { startDate, endDate },
    });
    return data.data!;
  },
};

