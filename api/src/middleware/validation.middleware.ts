import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Validate request and return errors if any
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((error) => `${error.type === 'field' ? error.path : 'field'}: ${error.msg}`)
        .join(', ');

      return next(new ValidationError(errorMessages));
    }

    next();
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.file && !req.files) {
    return next(new ValidationError('No file uploaded'));
  }

  next();
};

/**
 * Validate date range
 */
export const validateDateRange = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return next(new ValidationError('Start date and end date are required'));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ValidationError('Invalid date format'));
  }

  if (end <= start) {
    return next(new ValidationError('End date must be after start date'));
  }

  if (start < new Date()) {
    return next(new ValidationError('Start date cannot be in the past'));
  }

  next();
};

