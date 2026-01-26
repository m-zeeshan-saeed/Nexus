import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { messageService } from "../../services/messageService";
import { ChatUserList } from "../../components/chat/ChatUserList";
import { ChatConversation } from "../../types";
import { MessageCircle } from "lucide-react";

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (user) {
        try {
          const data = await messageService.getConversations();
          setConversations(data);
        } catch (error) {
          console.error("Failed to fetch conversations:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll for new messages/conversations
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {conversations.length > 0 ? (
        <ChatUserList conversations={conversations} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin
            conversations
          </p>
        </div>
      )}
    </div>
  );
};
