import { Router } from 'express';
import { body } from 'express-validator';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateDateRange } from '../middleware/validation.middleware';
import { UserRole } from '../types';

const router = Router();

// All routes require business owner authentication
router.use(authenticate, authorize(UserRole.BUSINESS_OWNER));

// Get cars owned by the current business owner
router.get('/cars', dashboardController.getOwnerCars);

// Get all reservations for owned cars
router.get('/reservations', dashboardController.getAllReservations);

// Create reservation (bypass frontend)
router.post(
  '/reservations/create',
  validate([
    body('carId').notEmpty().withMessage('Car ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('customerEmail').isEmail().withMessage('Valid customer email is required'),
    body('customerPhone').notEmpty().withMessage('Customer phone is required'),
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
  dashboardController.createReservation
);

// Cancel reservation
router.put('/reservations/:id/cancel', dashboardController.cancelReservationByOwner);

// Reassign reservation
router.put(
  '/reservations/:id/reassign',
  authenticate,
  validate([
    body('newCarId').notEmpty().withMessage('New car ID is required'),
  ]),
  dashboardController.reassignReservation
);

// Get reports
router.get('/reports', dashboardController.getReports);

// Get maintenance alerts
router.get('/maintenance/alerts', dashboardController.getMaintenanceAlerts);

export default router;

