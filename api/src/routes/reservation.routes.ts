import { Router } from 'express';
import { body } from 'express-validator';
import * as reservationController from '../controllers/reservation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateDateRange } from '../middleware/validation.middleware';

const router = Router();

// Soft reserve (guest - no auth required)
router.post(
  '/soft-reserve',
  validate([
    body('carId').notEmpty().withMessage('Car ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('guestInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('guestInfo.phone').notEmpty().withMessage('Phone number is required'),
    body('driverLicense.number').notEmpty().withMessage('Driver license number is required'),
    body('driverLicense.expiryDate')
      .isISO8601()
      .withMessage('Valid license expiry date is required')
      .custom((value) => {
        const expiry = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry < today) {
          throw new Error('Driver license has expired');
        }
        return true;
      }),
  ]),
  validateDateRange,
  reservationController.createSoftReservation
);

// Firm reserve (authenticated users - license from profile)
router.post(
  '/firm-reserve',
  authenticate,
  validate([
    body('carId').notEmpty().withMessage('Car ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ]),
  validateDateRange,
  reservationController.createFirmReservation
);

// Convert soft reserve to firm reserve
router.post(
  '/convert-soft-reserve',
  authenticate,
  validate([
    body('reservationId').notEmpty().withMessage('Reservation ID is required'),
  ]),
  reservationController.convertSoftReservation
);

// Get my reservations
router.get('/my-reservations', authenticate, reservationController.getMyReservations);

// Update reservation
router.put(
  '/:id',
  authenticate,
  validate([
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ]),
  validateDateRange,
  reservationController.updateReservation
);

// Cancel reservation
router.delete('/:id', authenticate, reservationController.cancelReservation);

// Rate reservation
router.post(
  '/:id/rate',
  authenticate,
  validate([
    body('stars').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().isString(),
  ]),
  reservationController.rateReservation
);

// Mark as picked up
router.post(
  '/:id/pickup',
  authenticate,
  validate([
    body('latitude').optional().isFloat().withMessage('Valid latitude is required'),
    body('longitude').optional().isFloat().withMessage('Valid longitude is required'),
    body('address').optional().isString(),
  ]),
  reservationController.markAsPickedUp
);

// Mark as returned
router.post(
  '/:id/return',
  authenticate,
  validate([
    body('latitude').optional().isFloat().withMessage('Valid latitude is required'),
    body('longitude').optional().isFloat().withMessage('Valid longitude is required'),
    body('address').optional().isString(),
  ]),
  reservationController.markAsReturned
);

export default router;

