import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get or create chat for a reservation
router.get('/:reservationId', chatController.getOrCreateChat);

// Get all chats for user
router.get('/', chatController.getUserChats);

export default router;

