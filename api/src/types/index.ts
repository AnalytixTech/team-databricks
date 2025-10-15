import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export enum UserRole {
  USER = 'user',
  BUSINESS_OWNER = 'business-owner',
}

export interface IDriverLicense {
  number: string;
  expiryDate: Date;
  state: string;
}

export interface IPaymentMethod {
  _id?: string;
  type: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  authorization_code?: string; // Paystack authorization code
}

export interface IUserProfile {
  businessName?: string;
  paystackSubaccountCode?: string;
  bankDetails?: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  driverLicense?: IDriverLicense;
  savedPaymentMethods: IPaymentMethod[];
}

export interface IUser extends Document {
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  googleId?: string;
  profile: IUserProfile;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Car Types
export enum CarType {
  SEDAN = 'sedan',
  SUV = 'suv',
  TRUCK = 'truck',
  VAN = 'van',
  LUXURY = 'luxury',
  SPORTS = 'sports',
  CONVERTIBLE = 'convertible',
}

export interface ICarAvailability {
  status: 'available' | 'unavailable';
  rules?: string;
  blockedDates: Date[];
}

export interface ICar {
  make: string;
  model: string;
  type: CarType;
  year: number;
  licensePlate: string;
  mileage?: number;
  weight?: number;
  rentalPricePerDay: number;
  images: string[];
  availability: ICarAvailability;
  ownerId: string;
  maintenance?: {
    lastServiceDate?: Date;
    lastServiceMileage?: number;
    nextServiceDue?: number;
    serviceIntervalKm?: number;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Car document type for Mongoose
export type ICarDocument = ICar & Document;

// Reservation Types
export enum ReservationType {
  SOFT_RESERVE = 'soft-reserve',
  FIRM_RESERVE = 'firm-reserve',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  DEPOSIT_PAID = 'deposit-paid',
  FULLY_PAID = 'fully-paid',
  REFUNDED = 'refunded',
}

export interface IGuestInfo {
  email: string;
  phone: string;
}

export interface IReservation extends Document {
  carId: string;
  userId?: string;
  guestInfo?: IGuestInfo;
  driverLicense: {
    number: string;
    expiryDate: Date;
  };
  reservationType: ReservationType;
  startDate: Date;
  endDate: Date;
  startTime?: string; // Optional time in HH:mm format
  endTime?: string; // Optional time in HH:mm format
  status: ReservationStatus;
  totalPrice: number;
  depositPaid: number;
  paymentStatus: PaymentStatus;
  softReserveExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  pickedUpAt?: Date;
  returnedAt?: Date;
  pickupLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  returnLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  rating?: {
    stars: number;
    review?: string;
    ratedAt?: Date;
  };
}

// Payment Types
export enum PaymentType {
  DEPOSIT = 'deposit',
  FULL_PAYMENT = 'full-payment',
  REFUND = 'refund',
}

export interface IPayment extends Document {
  reservationId: string;
  userId?: string;
  amount: number;
  type: PaymentType;
  paystackReference: string;
  status: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface AuthRequest extends Request {
  user?: Express.User;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Email Template Data
export interface ReservationEmailData {
  userName: string;
  carMake: string;
  carModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  reservationId: string;
}

// Search/Filter Types
export interface CarSearchFilters {
  make?: string;
  model?: string;
  type?: CarType;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Dashboard Report Types
export interface RevenueReport {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  periodStart: Date;
  periodEnd: Date;
}

