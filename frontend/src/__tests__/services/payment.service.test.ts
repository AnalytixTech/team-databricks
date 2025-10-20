import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from '@/services/payment.service';
import axios from '@/lib/axios';
import { PaymentType } from '@/types';

vi.mock('@/lib/axios');

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializePayment', () => {
    it('should initialize payment for deposit', async () => {
      const paymentData = {
        reservationId: 'reservation123',
        amount: 50000,
        type: PaymentType.DEPOSIT,
      };
      const mockResponse = {
        data: {
          data: {
            authorization_url: 'https://paystack.com/pay/xyz',
            access_code: 'access123',
            reference: 'ref123456',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await paymentService.initializePayment(paymentData);

      expect(axios.post).toHaveBeenCalledWith('/payments/initialize', paymentData);
      expect(result.authorization_url).toBe('https://paystack.com/pay/xyz');
      expect(result.reference).toBe('ref123456');
    });

    it('should initialize payment for full payment', async () => {
      const paymentData = {
        reservationId: 'reservation123',
        amount: 100000,
        type: PaymentType.FULL_PAYMENT,
      };
      const mockResponse = {
        data: {
          data: {
            authorization_url: 'https://paystack.com/pay/abc',
            access_code: 'access456',
            reference: 'ref789012',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await paymentService.initializePayment(paymentData);

      expect(axios.post).toHaveBeenCalledWith('/payments/initialize', paymentData);
      expect(result.authorization_url).toBe('https://paystack.com/pay/abc');
    });

    it('should handle payment initialization failure', async () => {
      const paymentData = {
        reservationId: 'reservation123',
        amount: 50000,
        type: PaymentType.DEPOSIT,
      };

      vi.mocked(axios.post).mockRejectedValue(new Error('Payment initialization failed'));

      await expect(paymentService.initializePayment(paymentData)).rejects.toThrow(
        'Payment initialization failed'
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      const reference = 'ref123456';
      const mockResponse = {
        data: {
          data: {
            status: 'success',
            amount: 50000,
            reference: 'ref123456',
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await paymentService.verifyPayment(reference);

      expect(axios.get).toHaveBeenCalledWith(`/payments/verify/${reference}`);
      expect(result.status).toBe('success');
      expect(result.reference).toBe(reference);
    });

    it('should verify failed payment', async () => {
      const reference = 'ref123456';
      const mockResponse = {
        data: {
          data: {
            status: 'failed',
            reference: 'ref123456',
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await paymentService.verifyPayment(reference);

      expect(result.status).toBe('failed');
    });

    it('should handle verification error', async () => {
      const reference = 'invalid-ref';

      vi.mocked(axios.get).mockRejectedValue(new Error('Payment not found'));

      await expect(paymentService.verifyPayment(reference)).rejects.toThrow('Payment not found');
    });
  });
});

