import mongoose, { Schema } from 'mongoose';
import { IReservation, ReservationType, ReservationStatus, PaymentStatus } from '../types';

const ReservationSchema = new Schema<IReservation>(
  {
    carId: {
      type: String,
      required: true,
      ref: 'Car',
      index: true,
    },
    userId: {
      type: String,
      ref: 'User',
      index: true,
    },
    guestInfo: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    driverLicense: {
      number: {
        type: String,
        required: true,
        trim: true,
      },
      expiryDate: {
        type: Date,
        required: true,
      },
    },
    reservationType: {
      type: String,
      enum: Object.values(ReservationType),
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String, // Format: "HH:mm" (e.g., "14:30")
    },
    endTime: {
      type: String, // Format: "HH:mm" (e.g., "16:30")
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.PENDING,
      index: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    depositPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    softReserveExpiry: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    pickedUpAt: {
      type: Date,
    },
    returnedAt: {
      type: Date,
    },
    pickupLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    returnLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    rating: {
      stars: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      ratedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for queries
ReservationSchema.index({ carId: 1, startDate: 1, endDate: 1 });
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ status: 1, reservationType: 1 });

// Validate that endDate is after startDate
ReservationSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

export default mongoose.model<IReservation>('Reservation', ReservationSchema);

