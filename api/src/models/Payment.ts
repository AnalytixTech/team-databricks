import mongoose, { Schema } from 'mongoose';
import { IPayment, PaymentType } from '../types';

const PaymentSchema = new Schema<IPayment>(
  {
    reservationId: {
      type: String,
      required: true,
      ref: 'Reservation',
      index: true,
    },
    userId: {
      type: String,
      ref: 'User',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    paystackReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);

