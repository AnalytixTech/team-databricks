import axios from '@/lib/axios';
import { ICar, CarSearchFilters, ApiResponse } from '@/types';

export const carService = {
  async getCars(filters?: CarSearchFilters): Promise<{ cars: ICar[]; total: number; pages: number }> {
    const { data } = await axios.get<ApiResponse<{ cars: ICar[]; total: number; pages: number }>>('/cars', {
      params: filters,
    });
    return data.data!;
  },

  async getCarById(id: string): Promise<ICar> {
    const { data } = await axios.get<ApiResponse<ICar>>(`/cars/${id}`);
    return data.data!;
  },

  async createCar(carData: Partial<ICar>): Promise<ICar> {
    const { data } = await axios.post<ApiResponse<ICar>>('/cars', carData);
    return data.data!;
  },

  async updateCar(id: string, carData: Partial<ICar>): Promise<ICar> {
    const { data } = await axios.put<ApiResponse<ICar>>(`/cars/${id}`, carData);
    return data.data!;
  },

  async deleteCar(id: string): Promise<void> {
    await axios.delete(`/cars/${id}`);
  },

  async uploadCarImages(id: string, images: File[]): Promise<ICar> {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const { data } = await axios.post<ApiResponse<ICar>>(
      `/cars/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.data!;
  },

  async getRecommendations(): Promise<{
    popular: ICar[];
    recommended: ICar[];
    preferredTypes: string[];
  }> {
    const { data } = await axios.get<ApiResponse<{
      popular: ICar[];
      recommended: ICar[];
      preferredTypes: string[];
    }>>('/cars/recommendations/list');
    return data.data!;
  },
};

