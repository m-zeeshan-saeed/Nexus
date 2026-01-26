import api from "./api";
import { Message, ChatConversation } from "../types";

export const messageService = {
  getConversations: async () => {
    const response = await api.get<ChatConversation[]>(
      "/messages/conversations",
    );
    return response.data;
  },

  getMessages: async (partnerId: string) => {
    const response = await api.get<Message[]>(`/messages/${partnerId}`);
    return response.data;
  },

  sendMessage: async (receiverId: string, content: string) => {
    const response = await api.post<Message>("/messages", {
      receiverId,
      content,
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<{ count: number }>("/messages/unread-count");
    return response.data.count;
  },
};

export default messageService;
