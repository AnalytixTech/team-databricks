import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import passport from '../config/passport';

const router = Router();

// Register
router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    body('role').optional().isIn(['user', 'business-owner']).withMessage('Invalid role'),
    body('businessName')
      .if(body('role').equals('business-owner'))
      .notEmpty()
      .withMessage('Business name is required for business owner registration'),
  ]),
  authController.register
);

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Refresh token
router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.refreshToken
);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

export default router;

