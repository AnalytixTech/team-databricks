export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  EMAIL_EXISTS: 'Email already registered',
  INVALID_TOKEN: 'Invalid or expired token',
  
  // User
  USER_NOT_FOUND: 'User not found',
  
  // Car
  CAR_NOT_FOUND: 'Car not found',
  CAR_UNAVAILABLE: 'Car is not available for the selected dates',
  
  // Reservation
  RESERVATION_NOT_FOUND: 'Reservation not found',
  INVALID_DATES: 'Invalid reservation dates',
  DATE_OVERLAP: 'Car already reserved for selected dates',
  SOFT_RESERVE_EXPIRED: 'Soft reservation has expired',
  CANNOT_MODIFY_RESERVATION: 'Cannot modify this reservation',
  
  // Payment
  PAYMENT_FAILED: 'Payment processing failed',
  PAYMENT_NOT_FOUND: 'Payment not found',
  
  // General
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
} as const;

export const SUCCESS_MESSAGES = {
  // Auth
  REGISTRATION_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  
  // Car
  CAR_CREATED: 'Car added successfully',
  CAR_UPDATED: 'Car updated successfully',
  CAR_DELETED: 'Car deleted successfully',
  
  // Reservation
  RESERVATION_CREATED: 'Reservation created successfully',
  RESERVATION_UPDATED: 'Reservation updated successfully',
  RESERVATION_CANCELLED: 'Reservation cancelled successfully',
  SOFT_RESERVE_CONVERTED: 'Reservation confirmed successfully',
  
  // Payment
  PAYMENT_SUCCESS: 'Payment processed successfully',
  
  // User
  PROFILE_UPDATED: 'Profile updated successfully',
  PAYMENT_METHOD_ADDED: 'Payment method added successfully',
  PAYMENT_METHOD_REMOVED: 'Payment method removed successfully',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const CLOUDINARY = {
  FOLDER: 'fleetly/cars',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
} as const;

