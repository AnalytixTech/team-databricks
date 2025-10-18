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
    body('phone').notEmpty().isMobilePhone('any').withMessage('Valid phone number is required'),
    body('role').optional().isIn(['regular_user', 'business_owner']).withMessage('Invalid role'),
    body('businessName')
      .if(body('role').equals('business_owner'))
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

// OTP Routes
router.post(
  '/send-otp',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('type').optional().isIn(['registration', 'forgot-password']).withMessage('Invalid OTP type'),
  ]),
  authController.sendOTP
);

router.post(
  '/verify-otp',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().isMobilePhone('any').withMessage('Valid phone number is required'),
    body('role').optional().isIn(['regular_user', 'business_owner']).withMessage('Invalid role'),
    body('businessName')
      .if(body('role').equals('business_owner'))
      .notEmpty()
      .withMessage('Business name is required for business owner registration'),
  ]),
  authController.verifyOTPAndRegister
);

router.post(
  '/resend-otp',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('type').optional().isIn(['registration', 'forgot-password']).withMessage('Invalid OTP type'),
  ]),
  authController.resendOTP
);

// Forgot Password Routes
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ]),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ]),
  authController.resetPassword
);

// Google OAuth with optional role parameter
router.get(
  '/google',
  (req, res, next) => {
    const role = req.query.role as string;
    // Store role in session state for callback
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: role || 'regular_user', // Pass role as state
    })(req, res, next);
  }
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

export default router;

