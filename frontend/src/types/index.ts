// User Types
export enum UserRole {
  USER = 'regular_user',
  BUSINESS_OWNER = 'business_owner',
}

export interface IDriverLicense {
  number: string;
  expiryDate: string;
  state: string;
}

export interface IPaymentMethod {
  _id?: string;
  type: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  authorization_code?: string;
}

export interface IUserProfile {
  businessName?: string;
  driverLicense?: IDriverLicense;
  savedPaymentMethods: IPaymentMethod[];
}

export interface IUser {
  _id: string;
  email: string;
  phone?: string;
  role: UserRole;
  googleId?: string;
  profile: IUserProfile;
  createdAt: string;
  updatedAt: string;
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
  blockedDates: string[];
}

export interface ICar {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  ratingCount?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

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

export interface IReservation {
  _id: string;
  carId: string | ICar;
  userId?: string;
  guestInfo?: IGuestInfo;
  driverLicense: {
    number: string;
    expiryDate: string;
  };
  reservationType: ReservationType;
  startDate: string;
  endDate: string;
  startTime?: string; // Optional time in HH:mm format
  endTime?: string; // Optional time in HH:mm format
  status: ReservationStatus;
  totalPrice: number;
  depositPaid: number;
  paymentStatus: PaymentStatus;
  softReserveExpiry?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  pickedUpAt?: string;
  returnedAt?: string;
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
    ratedAt?: string;
  };
}

// Payment Types
export enum PaymentType {
  DEPOSIT = 'deposit',
  FULL_PAYMENT = 'full-payment',
  REFUND = 'refund',
}

export interface IPayment {
  _id: string;
  reservationId: string;
  userId?: string;
  amount: number;
  type: PaymentType;
  paystackReference: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Search/Filter Types
export interface CarSearchFilters {
  make?: string;
  model?: string;
  type?: CarType;
  startDate?: string;
  endDate?: string;
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
  periodStart: string;
  periodEnd: string;
}

export interface TopCar {
  carId: string;
  make?: string;
  model?: string;
  revenue: number;
}

export interface StatusCount {
  _id: string;
  count: number;
}

export interface DetailedReport {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
  };
  topCars: TopCar[];
  reservationsByStatus: StatusCount[];
  reservationsByType: StatusCount[];
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  businessName?: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

