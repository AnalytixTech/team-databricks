import axios from '@/lib/axios';
import { ApiResponse } from '@/types';

interface Chat {
  _id: string;
  reservationId: string;
  participants: string[];
  messages: Array<{
    _id: string;
    senderId: string;
    text: string;
    createdAt: string;
    read: boolean;
  }>;
  lastMessage?: string;
  lastMessageAt?: string;
}

export const chatService = {
  async getOrCreateChat(reservationId: string): Promise<Chat> {
    const { data } = await axios.get<ApiResponse<Chat>>(
      `/chat/${reservationId}`
    );
    return data.data!;
  },

  async getUserChats(): Promise<Chat[]> {
    const { data } = await axios.get<ApiResponse<Chat[]>>('/chat');
    return data.data!;
  },
};

