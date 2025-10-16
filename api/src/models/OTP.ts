import mongoose, { Schema, Document } from 'mongoose';

export enum OTPType {
  REGISTRATION = 'registration',
  FORGOT_PASSWORD = 'forgot-password',
}

export interface IOTP extends Document {
  email: string;
  code: string;
  type: OTPType;
  attempts: number;
  expiresAt: Date;
  lastResendAt?: Date;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      select: false, // Don't return by default for security
    },
    type: {
      type: String,
      enum: Object.values(OTPType),
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastResendAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
OTPSchema.index({ email: 1, type: 1 });

// TTL index to auto-delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);

