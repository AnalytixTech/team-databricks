import { Router } from 'express';
import { body } from 'express-validator';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Initialize payment
router.post(
  '/initialize',
  authenticate,
  validate([
    body('reservationId').notEmpty().withMessage('Reservation ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('type').isIn(['deposit', 'full-payment']).withMessage('Valid payment type is required'),
  ]),
  paymentController.initializePayment
);

// Verify payment
router.get('/verify/:reference', authenticate, paymentController.verifyPayment);

// Paystack webhook (no auth)
router.post('/webhook', paymentController.paystackWebhook);

export default router;

