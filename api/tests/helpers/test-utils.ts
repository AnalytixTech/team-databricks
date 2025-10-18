import { Types } from 'mongoose';

// Global test utilities
export const createTestUser = (overrides = {}) => ({
  _id: 'test-user-id',
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  role: 'regular_user',
  ...overrides,
});

export const createTestCar = (overrides = {}) => ({
  _id: 'test-car-id',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  type: 'sedan',
  licensePlate: 'ABC123',
  rentalPricePerDay: 50,
  images: [],
  availability: {
    status: 'available',
    blockedDates: [],
  },
  ownerId: 'test-owner-id',
  location: {
    address: '123 Main St',
    city: 'Lagos',
    state: 'Lagos',
  },
  ...overrides,
});

export const createTestReservation = (overrides = {}) => ({
  _id: 'test-reservation-id',
  userId: 'test-user-id',
  carId: 'test-car-id',
  startDate: new Date(Date.now() + 86400000), // Tomorrow
  endDate: new Date(Date.now() + 172800000), // Day after tomorrow
  totalPrice: 100,
  status: 'confirmed',
  ...overrides,
});

export const createTestPayment = (overrides = {}) => ({
  _id: 'test-payment-id',
  reservationId: 'test-reservation-id',
  userId: 'test-user-id',
  amount: 100,
  status: 'completed',
  paystackReference: 'test-ref-123',
  ...overrides,
});

export const createTestChat = (overrides = {}) => ({
  _id: 'test-chat-id',
  reservationId: 'test-reservation-id',
  participants: ['test-user-id', 'test-owner-id'],
  messages: [],
  lastMessageAt: new Date(),
  ...overrides,
});

// Mock response helpers
export const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  cookie: jest.fn(),
  send: jest.fn(),
});

export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: undefined,
  ...overrides,
});

// Date helpers
export const getFutureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
export const getPastDate = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// MongoDB ObjectId helpers
export const createObjectId = () => new Types.ObjectId();
export const createObjectIdString = () => new Types.ObjectId().toString();

// Error assertion helpers
export const expectErrorWithStatus = (mockNext: any, status: number, message?: string) => {
  expect(mockNext).toHaveBeenCalledWith(
    expect.objectContaining({
      statusCode: status,
      ...(message && { message: expect.stringContaining(message) }),
    })
  );
};

export const expectSuccessResponse = (mockResponse: any, data?: any) => {
  expect(mockResponse.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      ...(data && { data }),
    })
  );
};

export const expectCreatedResponse = (mockResponse: any, data?: any) => {
  expect(mockResponse.status).toHaveBeenCalledWith(201);
  expectSuccessResponse(mockResponse, data);
};
