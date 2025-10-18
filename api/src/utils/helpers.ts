import { ApiResponse } from '../types';

/**
 * Create a standardized success response
 */
export const successResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Create a standardized error response
 */
export const errorResponse = (error: string, message?: string): ApiResponse => {
  return {
    success: false,
    message,
    error,
  };
};

/**
 * Check if two date ranges overlap
 */
export const datesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 <= end2 && end1 >= start2;
};

/**
 * Calculate number of days between two dates
 * If less than 24 hours, returns 1 day (minimum charge)
 * If more than 1 day, rounds up to the nearest whole day
 */
export const calculateDays = (startDate: Date, endDate: Date, startTime?: string, endTime?: string): number => {
  let start = new Date(startDate);
  let end = new Date(endDate);
  
  // If time is provided, incorporate it into the date
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
  }
  
  if (endTime) {
    const [hours, minutes] = endTime.split(':').map(Number);
    end.setHours(hours, minutes, 0, 0);
  }
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // If less than 1 day, charge for 1 day minimum
  // If more than 1 day, round up to nearest whole day
  return Math.max(1, Math.ceil(diffDays));
};

/**
 * Format date for email templates
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Generate a random reference string
 */
export const generateReference = (prefix: string = 'REF'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (basic)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

