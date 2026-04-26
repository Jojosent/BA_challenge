import api from './api';

export interface ChatMessage {
  id: number;
  text: string;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatarUrl?: string | null;
  };
}

export type ChatRoomType = 'family' | 'challenge';

export const chatService = {

  getMessages: async (
    roomType: ChatRoomType,
    roomId: number,
    limit: number = 50
  ): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/${roomType}/${roomId}`, {
      params: { limit },
    });
    return response.data;
  },

  sendMessage: async (
    roomType: ChatRoomType,
    roomId: number,
    text: string
  ): Promise<ChatMessage> => {
    const response = await api.post(`/chat/${roomType}/${roomId}`, { text });
    return response.data;
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await api.delete(`/chat/message/${messageId}`);
  },
};