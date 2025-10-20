import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, calculateDays } from '@/lib/utils';

describe('utils', () => {
  describe('cn()', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });
  });

  describe('formatCurrency()', () => {
    it('should format Nigerian Naira correctly', () => {
      const result = formatCurrency(25000);
      expect(result).toContain('25,000');
      expect(result).toMatch(/₦|NGN/);
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1,000,000');
    });

    it('should handle decimal values', () => {
      const result = formatCurrency(25000.50);
      expect(result).toContain('25,000');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-5000);
      expect(result).toContain('5,000');
    });
  });

  describe('formatDate()', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle different months', () => {
      const result = formatDate('2024-06-20');
      expect(result).toContain('June');
    });
  });

  describe('calculateDays()', () => {
    it('should calculate days between dates correctly', () => {
      const result = calculateDays('2024-01-01', '2024-01-05');
      expect(result).toBe(4);
    });

    it('should handle same day', () => {
      const result = calculateDays('2024-01-01', '2024-01-01');
      expect(result).toBe(0);
    });

    it('should handle reversed dates (absolute difference)', () => {
      const result = calculateDays('2024-01-05', '2024-01-01');
      expect(result).toBe(4);
    });

    it('should handle dates across months', () => {
      const result = calculateDays('2024-01-28', '2024-02-03');
      expect(result).toBe(6);
    });

    it('should handle dates across years', () => {
      const result = calculateDays('2023-12-30', '2024-01-02');
      expect(result).toBe(3);
    });

    it('should handle leap year', () => {
      const result = calculateDays('2024-02-28', '2024-03-01');
      expect(result).toBe(2); // 2024 is a leap year
    });

    it('should round up partial days', () => {
      // This test ensures ceiling is used
      const result = calculateDays('2024-01-01T10:00:00', '2024-01-02T09:00:00');
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});

