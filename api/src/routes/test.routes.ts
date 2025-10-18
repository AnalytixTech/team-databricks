import { Router, Request, Response } from 'express';
import Payment from '../models/Payment';
import Reservation from '../models/Reservation';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Simple health check without auth
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Test routes working'
  });
});

// Test endpoint to check database state
router.get('/check-payment-status/:reservationId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.params;
    
    console.log('🔍 Checking status for reservation:', reservationId);
    
    // Find reservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    
    // Find related payments
    const payments = await Payment.find({ reservationId });
    
    console.log('📊 Status:', {
      reservation: {
        id: reservation._id,
        paymentStatus: reservation.paymentStatus,
        depositPaid: reservation.depositPaid,
        totalPrice: reservation.totalPrice,
      },
      payments: payments.map(p => ({
        reference: p.paystackReference,
        status: p.status,
        type: p.type,
        amount: p.amount,
        paidAt: p.paidAt,
      }))
    });
    
    res.json({
      reservation: {
        id: reservation._id,
        paymentStatus: reservation.paymentStatus,
        depositPaid: reservation.depositPaid,
        totalPrice: reservation.totalPrice,
      },
      payments: payments.map(p => ({
        reference: p.paystackReference,
        status: p.status,
        type: p.type,
        amount: p.amount,
        paidAt: p.paidAt,
      }))
    });
  } catch (error) {
    console.error('❌ Error checking status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual update endpoint for testing
router.post('/manual-update/:reservationId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.params;
    const { paymentStatus, depositPaid } = req.body;
    
    console.log('🔧 Manual update:', { reservationId, paymentStatus, depositPaid });
    
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    
    if (paymentStatus) reservation.paymentStatus = paymentStatus;
    if (depositPaid) reservation.depositPaid = depositPaid;
    
    await reservation.save();
    console.log('✅ Manually updated');
    
    res.json({ success: true, reservation });
  } catch (error) {
    console.error('❌ Error updating:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check specific payment by reference (no auth for testing)
router.get('/check-payment/:reference', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;
    
    console.log('🔍 Checking payment:', reference);
    
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) {
      res.status(404).json({ error: 'Payment not found', reference });
      return;
    }
    
    const reservation = await Reservation.findById(payment.reservationId);
    
    console.log('📊 Payment Status:', {
      reference,
      payment: {
        status: payment.status,
        type: payment.type,
        amount: payment.amount,
        paidAt: payment.paidAt,
      },
      reservation: reservation ? {
        paymentStatus: reservation.paymentStatus,
        depositPaid: reservation.depositPaid,
      } : null
    });
    
    res.json({
      payment: {
        reference: payment.paystackReference,
        status: payment.status,
        type: payment.type,
        amount: payment.amount,
        paidAt: payment.paidAt,
      },
      reservation: reservation ? {
        id: reservation._id,
        paymentStatus: reservation.paymentStatus,
        depositPaid: reservation.depositPaid,
        totalPrice: reservation.totalPrice,
      } : null
    });
  } catch (error) {
    console.error('❌ Error checking payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

