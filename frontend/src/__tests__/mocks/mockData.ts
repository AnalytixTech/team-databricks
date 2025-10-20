import {
  IUser,
  ICar,
  IReservation,
  UserRole,
  CarType,
  ReservationType,
  ReservationStatus,
  PaymentStatus,
  AuthResponse,
} from '@/types';

export const mockUser: IUser = {
  _id: 'user123',
  email: 'test@example.com',
  phone: '+2341234567890',
  role: UserRole.USER,
  profile: {
    savedPaymentMethods: [],
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockBusinessOwner: IUser = {
  _id: 'owner123',
  email: 'owner@example.com',
  phone: '+2341234567890',
  role: UserRole.BUSINESS_OWNER,
  profile: {
    businessName: 'Test Car Rentals',
    savedPaymentMethods: [],
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
};

export const mockCar: ICar = {
  _id: 'car123',
  make: 'Toyota',
  model: 'Camry',
  type: CarType.SEDAN,
  year: 2023,
  licensePlate: 'ABC123XY',
  mileage: 15000,
  rentalPricePerDay: 25000,
  images: ['image1.jpg', 'image2.jpg'],
  availability: {
    status: 'available',
    blockedDates: [],
  },
  ownerId: 'owner123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  averageRating: 4.5,
  ratingCount: 10,
  location: {
    address: '123 Test Street',
    city: 'Lagos',
    state: 'Lagos',
    coordinates: {
      lat: 6.5244,
      lng: 3.3792,
    },
  },
};

export const mockReservation: IReservation = {
  _id: 'reservation123',
  carId: mockCar,
  userId: 'user123',
  driverLicense: {
    number: 'DL123456',
    expiryDate: '2025-12-31',
  },
  reservationType: ReservationType.FIRM_RESERVE,
  startDate: '2024-02-01',
  endDate: '2024-02-05',
  status: ReservationStatus.CONFIRMED,
  totalPrice: 100000,
  depositPaid: 0,
  paymentStatus: PaymentStatus.FULLY_PAID,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

export const mockSoftReservation: IReservation = {
  ...mockReservation,
  _id: 'soft-reservation123',
  reservationType: ReservationType.SOFT_RESERVE,
  status: ReservationStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  softReserveExpiry: '2024-01-16T00:00:00.000Z',
  guestInfo: {
    email: 'guest@example.com',
    phone: '+2341234567890',
  },
};

export const mockPayment = {
  _id: 'payment123',
  reservationId: 'reservation123',
  userId: 'user123',
  amount: 100000,
  type: 'full-payment',
  paystackReference: 'ref123456',
  status: 'success',
  paidAt: '2024-01-15T00:00:00.000Z',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

export const mockRevenueReport = {
  totalRevenue: 500000,
  totalBookings: 20,
  averageBookingValue: 25000,
  periodStart: '2024-01-01',
  periodEnd: '2024-01-31',
};

export const mockDetailedReport = {
  overview: {
    totalRevenue: 500000,
    totalBookings: 20,
    averageBookingValue: 25000,
  },
  topCars: [
    {
      carId: 'car123',
      make: 'Toyota',
      model: 'Camry',
      revenue: 150000,
      totalRevenue: 150000,
      bookingCount: 6,
    },
  ],
  reservationsByStatus: [
    { _id: 'confirmed', count: 15 },
    { _id: 'completed', count: 5 },
  ],
  reservationsByType: [
    { _id: 'firm-reserve', count: 18 },
    { _id: 'soft-reserve', count: 2 },
  ],
};

