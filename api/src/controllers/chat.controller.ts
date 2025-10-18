import { Response, NextFunction } from 'express';
import Chat from '../models/Chat';
import Reservation from '../models/Reservation';
import { AuthRequest } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { successResponse } from '../utils/helpers';

/**
 * Get or create chat for a reservation
 */
export const getOrCreateChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { reservationId } = req.params;
    const userId = (req.user as any).id;

    // Check if reservation exists
    const reservation = await Reservation.findById(reservationId).populate('carId');

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    // Verify user is either the renter or the car owner
    const carOwnerId = typeof reservation.carId === 'string' 
      ? reservation.carId 
      : (reservation.carId as any).ownerId;
    const renterId = reservation.userId;

    if (userId !== carOwnerId && userId !== renterId) {
      throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ reservationId });

    // If not, create new chat
    if (!chat) {
      chat = await Chat.create({
        reservationId,
        participants: [renterId, carOwnerId],
        messages: [],
      });
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(chat, 'Chat retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all chats for the authenticated user
 */
export const getUserChats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const userId = (req.user as any).id;

    // Find all chats where user is a participant
    const chats = await Chat.find({ participants: userId })
      .populate({
        path: 'reservationId',
        populate: {
          path: 'carId',
          select: 'make model images',
        },
      })
      .sort({ lastMessageAt: -1 });

    res.status(HTTP_STATUS.OK).json(
      successResponse(chats, 'Chats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

