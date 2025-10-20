import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '@/services/chat.service';
import axios from '@/lib/axios';

vi.mock('@/lib/axios');

describe('chatService', () => {
  const mockChat = {
    _id: 'chat123',
    reservationId: 'reservation123',
    participants: ['user123', 'owner123'],
    messages: [
      {
        _id: 'msg1',
        senderId: 'user123',
        text: 'Hello',
        createdAt: '2024-01-15T10:00:00.000Z',
        read: true,
      },
    ],
    lastMessage: 'Hello',
    lastMessageAt: '2024-01-15T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateChat', () => {
    it('should get existing chat', async () => {
      const mockResponse = { data: { data: mockChat } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await chatService.getOrCreateChat('reservation123');

      expect(axios.get).toHaveBeenCalledWith('/chat/reservation123');
      expect(result).toEqual(mockChat);
      expect(result.reservationId).toBe('reservation123');
    });

    it('should create new chat if not exists', async () => {
      const newChat = {
        ...mockChat,
        messages: [],
        lastMessage: undefined,
        lastMessageAt: undefined,
      };
      const mockResponse = { data: { data: newChat } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await chatService.getOrCreateChat('reservation456');

      expect(axios.get).toHaveBeenCalledWith('/chat/reservation456');
      expect(result.messages).toHaveLength(0);
    });

    it('should handle chat retrieval error', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Chat not found'));

      await expect(chatService.getOrCreateChat('invalid')).rejects.toThrow('Chat not found');
    });
  });

  describe('getUserChats', () => {
    it('should fetch all user chats', async () => {
      const mockChats = [mockChat];
      const mockResponse = { data: { data: mockChats } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await chatService.getUserChats();

      expect(axios.get).toHaveBeenCalledWith('/chat');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockChat);
    });

    it('should return empty array when no chats', async () => {
      const mockResponse = { data: { data: [] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await chatService.getUserChats();

      expect(result).toHaveLength(0);
    });

    it('should return chats sorted by last message', async () => {
      const chat1 = { ...mockChat, _id: 'chat1', lastMessageAt: '2024-01-15T10:00:00.000Z' };
      const chat2 = { ...mockChat, _id: 'chat2', lastMessageAt: '2024-01-15T11:00:00.000Z' };
      const mockResponse = { data: { data: [chat1, chat2] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await chatService.getUserChats();

      expect(result).toHaveLength(2);
    });
  });
});

