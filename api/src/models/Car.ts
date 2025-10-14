import mongoose, { Schema } from 'mongoose';
import { CarType } from '../types';

const CarSchema = new Schema(
  {
    make: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CarType),
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    mileage: {
      type: Number,
      min: 0,
    },
    weight: {
      type: Number,
      min: 0,
    },
    rentalPricePerDay: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    availability: {
      status: {
        type: String,
        enum: ['available', 'unavailable'],
        default: 'available',
      },
      rules: String,
      blockedDates: {
        type: [Date],
        default: [],
      },
    },
    ownerId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    maintenance: {
      lastServiceDate: Date,
      lastServiceMileage: Number,
      nextServiceDue: Number,
      serviceIntervalKm: {
        type: Number,
        default: 5000,
      },
    },
    location: {
      address: String,
      city: String,
      state: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for searching
CarSchema.index({ make: 1, model: 1, type: 1 });
CarSchema.index({ rentalPricePerDay: 1, type: 1 });

export default mongoose.model('Car', CarSchema);

