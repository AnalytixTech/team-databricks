import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put(
  '/profile',
  validate([
    body('phone').optional().isMobilePhone('any'),
    body('businessName').optional().isString(),
    body('driverLicense.number').optional().isString(),
    body('driverLicense.expiryDate')
      .optional()
      .isISO8601()
      .custom((value) => {
        if (value) {
          const expiry = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (expiry < today) {
            throw new Error('Driver license has expired');
          }
        }
        return true;
      }),
    body('driverLicense.state').optional().isString(),
  ]),
  userController.updateProfile
);

// Setup payout account (business owners only)
router.post(
  '/payout/setup',
  validate([
    body('bankCode').notEmpty().withMessage('Bank code is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
  ]),
  userController.setupPayoutAccount
);

// Get list of banks
router.get('/banks', userController.getBanks);

export default router;
