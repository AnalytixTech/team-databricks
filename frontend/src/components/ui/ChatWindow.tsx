import { useState, useEffect, useRef } from 'react';
import { Send, Loader, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import Button from './Button';
import { useAuthStore } from '@/store/auth.store';
import { chatService } from '@/services/chat.service';
import { format } from 'date-fns';

interface Message {
  _id: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

interface ChatWindowProps {
  reservationId: string;
  otherParticipantName?: string;
  onClose?: () => void;
}

export default function ChatWindow({ reservationId, otherParticipantName, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, token } = useAuthStore();

  // Step 1: Initialize chat via HTTP endpoint
  useEffect(() => {
    if (!reservationId) return;

    const initializeChat = async () => {
      try {
        console.log('🔄 Initializing chat for reservation:', reservationId);
        await chatService.getOrCreateChat(reservationId);
        console.log('✅ Chat initialized successfully');
        setChatInitialized(true);
      } catch (error: any) {
        console.error('❌ Failed to initialize chat:', error);
        toast.error(error.response?.data?.message || 'Failed to initialize chat');
        setIsConnecting(false);
      }
    };

    initializeChat();
  }, [reservationId]);

  // Step 2: Connect via Socket.IO after chat is initialized
  useEffect(() => {
    if (!token || !reservationId || !chatInitialized) return;

    // Initialize socket connection
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(backendUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnecting(false);
      
      // Join chat room
      socket.emit('join-chat', reservationId);
    });

    socket.on('chat-history', (history: Message[]) => {
      console.log('📜 Chat history received:', history.length, 'messages');
      setMessages(history);
      scrollToBottom();
    });

    socket.on('new-message', (message: Message) => {
      console.log('💬 New message received');
      setMessages((prev) => [...prev, message]);
      scrollToBottom();

      // Mark as read if not from current user
      if (message.senderId !== user?._id) {
        socket.emit('mark-as-read', { reservationId });
      }
    });

    socket.on('chat-error', (data: { message: string }) => {
      console.error('❌ Chat error:', data.message);
      toast.error(data.message);
      setIsConnecting(false);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnecting(true);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      toast.error('Failed to connect to chat server');
      setIsConnecting(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [reservationId, token, user?._id, chatInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socketRef.current || isSending) {
      return;
    }

    setIsSending(true);

    socketRef.current.emit('send-message', {
      reservationId,
      text: newMessage.trim(),
    });

    setNewMessage('');
    setIsSending(false);
    
    // Refocus input after sending
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative mx-4 flex h-[600px] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
              {otherParticipantName?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {otherParticipantName || 'Chat'}
              </h3>
              {isConnecting ? (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader className="h-3 w-3 animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
                  Online
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Messages Area - Fixed height with own scrollbar */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ height: 0 }}>
          {messages.length === 0 && !isConnecting && (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Send className="h-8 w-8" />
              </div>
              <p className="text-center">No messages yet</p>
              <p className="text-center text-sm">Start the conversation!</p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.senderId === user?._id;
              const showTimestamp = index === 0 || 
                new Date(messages[index - 1].createdAt).getDate() !== new Date(message.createdAt).getDate();

              return (
                <div key={message._id}>
                  {/* Date Separator */}
                  {showTimestamp && (
                    <div className="flex items-center justify-center my-4">
                      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`group relative max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.text}</p>
                      <p
                        className={`mt-1 text-xs ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isConnecting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || isConnecting || isSending}
              isLoading={isSending}
              className="h-11 w-11 shrink-0 rounded-xl p-0 bg-gradient-to-br from-blue-600 to-blue-500"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
