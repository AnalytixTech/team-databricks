import { Response, NextFunction } from 'express';
import * as chatController from '../../../src/controllers/chat.controller';
import Chat from '../../../src/models/Chat';
import Reservation from '../../../src/models/Reservation';
import { AuthRequest } from '../../../src/types';
import { 
  createMockRequest, 
  createMockResponse, 
  expectErrorWithStatus,
  expectSuccessResponse
} from '../../helpers/test-utils';

// Mock the models
jest.mock('../../../src/models/Chat');
jest.mock('../../../src/models/Reservation');

describe('Chat Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getOrCreateChat', () => {
    it('should return existing chat if found', async () => {
      const reservationId = 'reservation-id';
      const userId = 'user-id';
      const ownerId = 'owner-id';
      
      mockRequest.params = { reservationId };
      mockRequest.user = { id: userId, _id: userId } as any;

      const mockReservation = {
        _id: reservationId,
        userId: userId,
        carId: { ownerId: ownerId },
      };

      const mockChat = {
        _id: 'chat-id',
        reservationId: reservationId,
        participants: [userId, ownerId],
        messages: [],
        populate: jest.fn().mockReturnThis(),
      };

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });
      (Chat.findOne as jest.Mock).mockResolvedValue(mockChat);

      await chatController.getOrCreateChat(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Reservation.findById).toHaveBeenCalledWith(reservationId);
      expect(Chat.findOne).toHaveBeenCalledWith({ reservationId });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should create new chat if not found', async () => {
      const reservationId = 'reservation-id';
      const userId = 'user-id';
      const ownerId = 'owner-id';
      
      mockRequest.params = { reservationId };
      mockRequest.user = { id: userId, _id: userId } as any;

      const mockReservation = {
        _id: reservationId,
        userId: userId,
        carId: { ownerId: ownerId },
      };

      const newChat = {
        _id: 'new-chat-id',
        reservationId: reservationId,
        participants: [userId, ownerId],
        messages: [],
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockReturnThis(),
      };

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });
      (Chat.findOne as jest.Mock).mockResolvedValue(null);
      (Chat.create as jest.Mock).mockResolvedValue(newChat);

      await chatController.getOrCreateChat(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Chat.create).toHaveBeenCalledWith({
        reservationId,
        participants: [userId, ownerId],
        messages: [],
      });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 404 if reservation not found', async () => {
      mockRequest.params = { reservationId: 'nonexistent-id' };
      mockRequest.user = { id: 'user-id', _id: 'user-id' } as any;

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await chatController.getOrCreateChat(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 404, 'Reservation not found');
    });

    it('should return 403 if user is not a participant', async () => {
      const reservationId = 'reservation-id';
      const userId = 'user-id';
      const differentUserId = 'different-user-id';
      const ownerId = 'owner-id';
      
      mockRequest.params = { reservationId };
      mockRequest.user = { id: differentUserId, _id: differentUserId } as any;

      const mockReservation = {
        _id: reservationId,
        userId: userId,
        carId: { ownerId: ownerId },
      };

      (Reservation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });

      await chatController.getOrCreateChat(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 403, 'Access forbidden');
    });

    it('should return 400 if user is not authenticated', async () => {
      mockRequest.params = { reservationId: 'reservation-id' };
      mockRequest.user = undefined;

      await chatController.getOrCreateChat(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 403, 'Unauthorized access');
    });
  });

  describe('getUserChats', () => {
    it('should return all chats for the user', async () => {
      const userId = 'user-id';
      mockRequest.user = { id: userId, _id: userId } as any;

      const mockChats = [
        {
          _id: 'chat-1',
          reservationId: { _id: 'res-1', carId: { make: 'Toyota', model: 'Camry' } },
          participants: [userId, 'owner-1'],
          lastMessage: { text: 'Hello', timestamp: new Date() },
        },
        {
          _id: 'chat-2',
          reservationId: { _id: 'res-2', carId: { make: 'Honda', model: 'Civic' } },
          participants: [userId, 'owner-2'],
          lastMessage: { text: 'Hi', timestamp: new Date() },
        },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockChats),
      };

      (Chat.find as jest.Mock).mockReturnValue(mockQuery);

      await chatController.getUserChats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(Chat.find).toHaveBeenCalledWith({ participants: userId });
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'reservationId',
        populate: {
          path: 'carId',
          select: 'make model images',
        },
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ lastMessageAt: -1 });
      expectSuccessResponse(mockResponse, mockChats);
    });

    it('should return empty array if no chats found', async () => {
      const userId = 'user-id';
      mockRequest.user = { id: userId, _id: userId } as any;

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };

      (Chat.find as jest.Mock).mockReturnValue(mockQuery);

      await chatController.getUserChats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectSuccessResponse(mockResponse, []);
    });

    it('should return 400 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await chatController.getUserChats(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expectErrorWithStatus(mockNext, 403, 'Unauthorized access');
    });
  });
});
