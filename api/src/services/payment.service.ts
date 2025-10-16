import { config } from '../config/env';
import { generateReference } from '../utils/helpers';

// Note: Paystack SDK types might vary, using a generic approach
interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    customer: {
      email: string;
    };
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
    };
  };
}

class PaymentService {
  private secretKey = config.PAYSTACK_SECRET_KEY;
  private baseUrl = 'https://api.paystack.co';

  /**
   * Initialize payment transaction with optional subaccount and commission
   */
  async initializeTransaction(
    email: string,
    amount: number,
    metadata?: Record<string, any>,
    subaccountCode?: string
  ): Promise<PaystackInitializeResponse> {
    try {
      const reference = generateReference('TXN');

      const requestBody: any = {
        email,
        amount: amount * 100, // Paystack expects amount in kobo/cents
        reference,
        callback_url: `${config.FRONTEND_URL}/verify/${reference}`,
        metadata,
      };

      // Add subaccount and commission if provided (for business owner payments)
      if (subaccountCode) {
        requestBody.subaccount = subaccountCode;
        requestBody.transaction_charge = Math.floor(amount * 0.06 * 100); // 6% to platform in kobo
        requestBody.bearer = 'subaccount'; // Subaccount bears Paystack fees
        
        console.log('💰 Payment with commission:', {
          total: amount,
          platformFee: amount * 0.06,
          ownerReceives: amount * 0.94,
        });
      }

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as PaystackInitializeResponse;

      if (!data.status) {
        throw new Error(data.message || 'Failed to initialize transaction');
      }

      console.log(`✅ Payment initialized: ${data.data.reference}`);
      return data;
    } catch (error) {
      console.error('❌ Error initializing payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment transaction and update database
   */
  async verifyTransaction(
    reference: string
  ): Promise<PaystackVerifyResponse> {
    try {
      console.log(`🔍 Verifying transaction with Paystack: ${reference}`);
      
      const response = await fetch(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as PaystackVerifyResponse;

      if (!data.status) {
        console.error('❌ Paystack verification failed:', data.message);
        throw new Error(data.message || 'Failed to verify transaction');
      }

      // Log successful verification
      console.log(`✅ Paystack verification successful:`, {
        reference: data.data.reference,
        status: data.data.status,
        amount: data.data.amount / 100, // Convert from kobo to naira
        customer: data.data.customer.email,
      });

      // Now update both collections immediately
      await this.updatePaymentAndReservation(reference);

      return data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Update both Payment and Reservation collections after successful verification
   */
  private async updatePaymentAndReservation(reference: string): Promise<void> {
    try {
      const Payment = require('../models/Payment').default;
      const Reservation = require('../models/Reservation').default;
      const { PaymentType, PaymentStatus } = require('../types');

      // Find and update payment
      const payment = await Payment.findOne({ paystackReference: reference });
      if (!payment) {
        throw new Error(`Payment not found for reference: ${reference}`);
      }

      console.log('📄 Updating payment document:', {
        id: payment._id,
        currentStatus: payment.status,
        newStatus: 'success',
      });

      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();
      console.log('✅ Payment document updated successfully');

      // Find and update reservation
      const reservation = await Reservation.findById(payment.reservationId);
      if (!reservation) {
        throw new Error(`Reservation not found: ${payment.reservationId}`);
      }

      console.log('📋 Updating reservation document:', {
        id: reservation._id,
        currentPaymentStatus: reservation.paymentStatus,
        currentDepositPaid: reservation.depositPaid,
        paymentType: payment.type,
        paymentAmount: payment.amount,
      });

      // Update reservation based on payment type
      if (payment.type === PaymentType.DEPOSIT) {
        reservation.depositPaid = payment.amount;
        reservation.paymentStatus = PaymentStatus.DEPOSIT_PAID;
        console.log('💰 Updated to DEPOSIT_PAID, deposit amount:', payment.amount);
      } else if (payment.type === PaymentType.FULL_PAYMENT) {
        // Handle full payment (could be initial full payment or remaining balance)
        if (reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID) {
          // This is remaining balance payment
          reservation.depositPaid = reservation.totalPrice; // Now fully paid
        } else {
          // This is initial full payment
          reservation.depositPaid = payment.amount;
        }
        reservation.paymentStatus = PaymentStatus.FULLY_PAID;
        console.log('💯 Updated to FULLY_PAID');
      }

      // Update reservation status to confirmed if not already confirmed
      const { ReservationStatus } = require('../types');
      if (reservation.status !== ReservationStatus.CONFIRMED) {
        const previousStatus = reservation.status;
        reservation.status = ReservationStatus.CONFIRMED;
        console.log('✅ Updated reservation status:', {
          from: previousStatus,
          to: ReservationStatus.CONFIRMED
        });
      } else {
        console.log('ℹ️ Reservation already confirmed, keeping status');
      }

      await reservation.save();
      console.log('✅ Reservation document updated successfully:', {
        newPaymentStatus: reservation.paymentStatus,
        newDepositPaid: reservation.depositPaid,
      });

    } catch (updateError) {
      console.error('❌ Error updating database:', updateError);
      throw updateError;
    }
  }

  /**
   * Charge authorization (for saved cards)
   */
  async chargeAuthorization(
    authorizationCode: string,
    email: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<any> {
    try {
      const reference = generateReference('TXN');

      const response = await fetch(`${this.baseUrl}/transaction/charge_authorization`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_code: authorizationCode,
          email,
          amount: amount * 100,
          reference,
          metadata,
        }),
      });

      const data = await response.json() as any;

      if (!data.status) {
        throw new Error(data.message || 'Failed to charge authorization');
      }

      console.log(`✅ Authorization charged: ${reference}`);
      return data;
    } catch (error) {
      console.error('❌ Error charging authorization:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async refundTransaction(
    reference: string,
    amount?: number
  ): Promise<any> {
    try {
      const body: any = { transaction: reference };
      if (amount) {
        body.amount = amount * 100;
      }

      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json() as any;

      if (!data.status) {
        throw new Error(data.message || 'Failed to process refund');
      }

      console.log(`✅ Refund processed: ${reference}`);
      return data;
    } catch (error) {
      console.error('❌ Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(body))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Create Paystack subaccount for business owner
   */
  async createSubaccount(data: {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge: number;
  }): Promise<{ subaccount_code: string; account_name: string }> {
    try {
      console.log('💼 Creating Paystack subaccount for:', data.businessName);

      const response = await fetch(`${this.baseUrl}/subaccount`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_name: data.businessName,
          settlement_bank: data.bankCode,
          account_number: data.accountNumber,
          percentage_charge: data.percentageCharge,
        }),
      });

      const result = await response.json() as any;

      if (!result.status) {
        throw new Error(result.message || 'Failed to create subaccount');
      }

      console.log('✅ Subaccount created:', result.data.subaccount_code);
      
      return {
        subaccount_code: result.data.subaccount_code,
        account_name: result.data.account_name,
      };
    } catch (error) {
      console.error('❌ Error creating subaccount:', error);
      throw error;
    }
  }

  /**
   * List all banks (for bank code selection)
   */
  async listBanks(): Promise<Array<{ name: string; code: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/bank?currency=NGN`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const result = await response.json() as any;

      if (!result.status) {
        throw new Error(result.message || 'Failed to fetch banks');
      }

      return result.data.map((bank: any) => ({
        name: bank.name,
        code: bank.code,
      }));
    } catch (error) {
      console.error('❌ Error fetching banks:', error);
      throw error;
    }
  }

  /**
   * Verify account number
   */
  async verifyAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<{ account_name: string; account_number: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const result = await response.json() as any;

      if (!result.status) {
        throw new Error(result.message || 'Failed to verify account');
      }

      return {
        account_name: result.data.account_name,
        account_number: result.data.account_number,
      };
    } catch (error) {
      console.error('❌ Error verifying account:', error);
      throw error;
    }
  }
}

export default new PaymentService();

