import { Router } from 'express';
import authRoutes from './auth.routes';
import carRoutes from "./car.routes";
import paymentRoutes from "./payment.routes";
import chatRoutes from "./chat.routes";

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use("/payments", paymentRoutes);
router.use("/chat", chatRoutes);


// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

