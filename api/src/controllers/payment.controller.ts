import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';
import { AuthRequest, PaymentType, PaymentStatus, ReservationStatus } from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { successResponse } from '../utils/helpers';
import paymentService from '../services/payment.service';

/**
 * Initialize payment transaction
 */
export const initializePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { reservationId, amount, type } = req.body;

    // Find reservation
    const reservation = await Reservation.findById(reservationId).populate('carId');
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Validate ownership
    if (reservation.userId !== (req.user as any).id) {
      throw new BadRequestError('Unauthorized to pay for this reservation');
    }

    // Get car owner's subaccount code for commission split
    const Car = (await import('../models/Car')).default;
    const User = (await import('../models/User')).default;
    const car = await Car.findById(reservation.carId);
    const owner = car ? await User.findById(car.ownerId) : null;
    const subaccountCode = owner?.profile?.paystackSubaccountCode;

    // Initialize Paystack transaction with subaccount (6% commission)
    const paystackResponse = await paymentService.initializeTransaction(
      (req.user as any).email,
      amount,
      {
        reservationId,
        userId: (req.user as any).id,
        type,
      },
      subaccountCode // Pass owner's subaccount for commission split
    );

    // Create payment record
    const payment = await Payment.create({
      reservationId,
      userId: (req.user as any).id,
      amount,
      type,
      paystackReference: paystackResponse.data.reference,
      status: 'pending',
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        payment,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment transaction
 */
export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference } = req.params;

    console.log('🔍 Verifying payment reference:', reference);

    // Find payment
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) {
      console.error('❌ Payment not found for reference:', reference);
      throw new NotFoundError(ERROR_MESSAGES.PAYMENT_NOT_FOUND);
    }

    console.log('📄 Payment found:', {
      id: payment._id,
      status: payment.status,
      type: payment.type,
      amount: payment.amount,
    });

    // Verify with Paystack
    const verifyResponse = await paymentService.verifyTransaction(reference);
    console.log('✅ Paystack verification response:', verifyResponse.data.status);

    if (verifyResponse.data.status === 'success') {
      // Update payment status
      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();
      console.log('✅ Payment document updated to success');

      // Update reservation
      const reservation = await Reservation.findById(payment.reservationId);
      if (!reservation) {
        console.error('❌ Reservation not found:', payment.reservationId);
        throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
      }

      console.log('📋 Current reservation status:', {
        id: reservation._id,
        paymentStatus: reservation.paymentStatus,
        depositPaid: reservation.depositPaid,
      });

      // Update based on payment type
      if (payment.type === PaymentType.DEPOSIT) {
        reservation.depositPaid = payment.amount;
        reservation.paymentStatus = PaymentStatus.DEPOSIT_PAID;
        console.log('💰 Updating to DEPOSIT_PAID, deposit:', payment.amount);
      } else if (payment.type === PaymentType.FULL_PAYMENT) {
        // If this is a full payment after deposit, add to deposit amount
        if (reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID) {
          // Already has deposit, this is the remaining balance
          reservation.depositPaid = reservation.totalPrice; // Full amount now paid
        }
        reservation.paymentStatus = PaymentStatus.FULLY_PAID;
        console.log('💯 Updating to FULLY_PAID');
      }

      // Update reservation status to confirmed if not already confirmed
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
      console.log('✅ Reservation updated successfully:', {
        paymentStatus: reservation.paymentStatus,
        depositPaid: reservation.depositPaid,
      });

      res.status(HTTP_STATUS.OK).json(
        successResponse(
          { 
            payment: {
              id: payment._id,
              status: payment.status,
              amount: payment.amount,
              type: payment.type,
              paidAt: payment.paidAt,
            },
            reservation: {
              id: reservation._id,
              paymentStatus: reservation.paymentStatus,
              depositPaid: reservation.depositPaid,
            },
            verified: true 
          }, 
          SUCCESS_MESSAGES.PAYMENT_SUCCESS
        )
      );
    } else {
      console.warn('⚠️ Payment verification failed, status:', verifyResponse.data.status);
      payment.status = 'failed';
      await payment.save();

      res.status(HTTP_STATUS.BAD_REQUEST).json(
        successResponse({ payment, verified: false }, ERROR_MESSAGES.PAYMENT_FAILED)
      );
    }
  } catch (error) {
    console.error('❌ Error in verifyPayment:', error);
    next(error);
  }
};

/**
 * Paystack webhook handler
 */
export const paystackWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(signature, req.body);

    if (!isValid) {
      throw new BadRequestError('Invalid webhook signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // Find and update payment
      const payment = await Payment.findOne({ paystackReference: reference });
      if (payment) {
        payment.status = 'success';
        payment.paidAt = new Date();
        await payment.save();

        // Update reservation
        const reservation = await Reservation.findById(payment.reservationId);
        if (reservation) {
          if (payment.type === PaymentType.DEPOSIT) {
            reservation.depositPaid = payment.amount;
            reservation.paymentStatus = PaymentStatus.DEPOSIT_PAID;
          } else if (payment.type === PaymentType.FULL_PAYMENT) {
            reservation.paymentStatus = PaymentStatus.FULLY_PAID;
          }
          
          // Update reservation status to confirmed if not already confirmed
          if (reservation.status !== ReservationStatus.CONFIRMED) {
            reservation.status = ReservationStatus.CONFIRMED;
          }
          
          await reservation.save();
        }
      }
    }

    res.status(HTTP_STATUS.OK).send('Webhook received');
  } catch (error) {
    next(error);
  }
};

