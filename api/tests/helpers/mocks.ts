// Mock all external services and dependencies

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PAYSTACK_SECRET_KEY = 'test-paystack-secret';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.SENDGRID_FROM_EMAIL = 'test@fleetly.com';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.GEOCODE_API_KEY = 'test-geocode-key';

// Mock mongoose entirely
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    collections: {},
    readyState: 0,
  },
  Schema: jest.fn(),
  model: jest.fn(),
  Types: {
    ObjectId: jest.fn(() => ({
      toString: () => 'mock-object-id',
    })),
  },
}));

// Mock all Mongoose models
jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));

jest.mock('../../src/models/Car', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));

jest.mock('../../src/models/Reservation', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateMany: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));

jest.mock('../../src/models/Payment', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));

jest.mock('../../src/models/Chat', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));

// Mock external services
jest.mock('@sendgrid/mail');
jest.mock('cloudinary');
jest.mock('../../src/services/payment.service');
jest.mock('../../src/services/geocoding.service');
jest.mock('../../src/services/email.service');

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Mock passport
jest.mock('passport');
jest.mock('passport-google-oauth20');
jest.mock('passport-jwt');
