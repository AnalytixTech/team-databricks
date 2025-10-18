import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import Chat from '../models/Chat';

interface SocketData {
  userId: string;
}

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      (socket.data as SocketData).userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`✅ User connected: ${(socket.data as SocketData).userId}`);

    // Join reservation chat room
    socket.on('join-chat', async (reservationId: string) => {
      try {
        let chat = await Chat.findOne({ reservationId });

        if (!chat) {
          console.error(`❌ Chat not found for reservation: ${reservationId}`);
          socket.emit('chat-error', { message: 'Chat not found. Please refresh and try again.' });
          return;
        }

        // Verify user is a participant
        if (!chat.participants.includes((socket.data as SocketData).userId)) {
          console.error(`❌ User ${(socket.data as SocketData).userId} is not a participant in chat for reservation ${reservationId}`);
          socket.emit('chat-error', { message: 'You are not authorized to access this chat.' });
          return;
        }

        socket.join(reservationId);
        console.log(`✅ User ${(socket.data as SocketData).userId} joined chat for reservation ${reservationId}`);

        // Send chat history
        socket.emit('chat-history', chat.messages);
      } catch (error) {
        console.error('❌ Error joining chat:', error);
        socket.emit('chat-error', { message: 'Failed to join chat. Please try again.' });
      }
    });

    // Send message
    socket.on('send-message', async (data: { reservationId: string; text: string }) => {
      try {
        const { reservationId, text } = data;
        const senderId = (socket.data as SocketData).userId;

        const chat = await Chat.findOne({ reservationId });

        if (!chat) {
          console.error(`❌ Chat not found for reservation: ${reservationId}`);
          return;
        }

        // Verify user is a participant
        if (!chat.participants.includes(senderId)) {
          console.error(`❌ User ${senderId} is not a participant in chat for reservation ${reservationId}`);
          return;
        }

        // Add message to chat
        chat.messages.push({
          senderId,
          text,
          read: false,
        } as any);

        chat.lastMessage = text;
        chat.lastMessageAt = new Date();

        await chat.save();

        const newMessage = chat.messages[chat.messages.length - 1];

        // Broadcast message to all participants in the room
        io?.to(reservationId).emit('new-message', newMessage);

        console.log(`✅ Message sent in chat for reservation ${reservationId}`);
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    });

    // Mark messages as read
    socket.on('mark-as-read', async (data: { reservationId: string }) => {
      try {
        const { reservationId } = data;
        const userId = (socket.data as SocketData).userId;

        const chat = await Chat.findOne({ reservationId });

        if (!chat) {
          return;
        }

        // Mark all messages from other participants as read
        let updated = false;
        chat.messages.forEach((message: any) => {
          if (message.senderId !== userId && !message.read) {
            message.read = true;
            updated = true;
          }
        });

        if (updated) {
          await chat.save();
          console.log(`✅ Messages marked as read for reservation ${reservationId}`);
        }
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${(socket.data as SocketData).userId}`);
    });
  });

  console.log('🚀 Socket.IO initialized');

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

