import axios from '@/lib/axios';
import { ApiResponse, PaymentType } from '@/types';

interface InitializePaymentData {
  reservationId: string;
  amount: number;
  type: PaymentType;
}

interface PaymentInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export const paymentService = {
  async initializePayment(data: InitializePaymentData): Promise<PaymentInitResponse> {
    const { data: response } = await axios.post<ApiResponse<PaymentInitResponse>>(
      '/payments/initialize',
      data
    );
    return response.data!;
  },

  async verifyPayment(reference: string): Promise<any> {
    const { data } = await axios.get<ApiResponse<any>>(
      `/payments/verify/${reference}`
    );
    return data.data!;
  },
};

