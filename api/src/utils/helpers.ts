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
 */
export const calculateDays = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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

