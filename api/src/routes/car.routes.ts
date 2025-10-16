import { Router } from 'express';
import { body } from 'express-validator';
import * as carController from '../controllers/car.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload } from '../middleware/multer.middleware';
import { UserRole } from '../types';

const router = Router();

// Get all cars (public)
router.get('/', carController.getCars);

// Get recommended/popular cars (public, enhanced if authenticated)
router.get('/recommendations/list', carController.getRecommendedCars);

// Get car by ID (public)
router.get('/:id', carController.getCarById);

// Create car (business owner only)
router.post(
  '/',
  authenticate,
  authorize(UserRole.BUSINESS_OWNER),
  validate([
    body('make').notEmpty().trim().withMessage('Make is required'),
    body('model').notEmpty().trim().withMessage('Model is required'),
    body('type').notEmpty().withMessage('Car type is required'),
    body('year').isInt({ min: 1900 }).withMessage('Valid year is required'),
    body('licensePlate').notEmpty().trim().toUpperCase().withMessage('License plate is required'),
    body('rentalPricePerDay').isFloat({ min: 0 }).withMessage('Valid rental price is required'),
  ]),
  carController.createCar
);

// Update car (business owner only)
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.BUSINESS_OWNER),
  carController.updateCar
);

// Delete car (business owner only)
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.BUSINESS_OWNER),
  carController.deleteCar
);

// Upload car images (business owner only)
router.post(
  '/:id/images',
  authenticate,
  authorize(UserRole.BUSINESS_OWNER),
  upload.array('images', 10),
  carController.uploadCarImages
);

export default router;

