import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, Phone, Video, Info, Smile } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ChatMessage } from "../../components/chat/ChatMessage";
import { ChatUserList } from "../../components/chat/ChatUserList";
import { useAuth } from "../../context/AuthContext";
import { Message, ChatConversation, User } from "../../types";
import { messageService } from "../../services/messageService";
import api from "../../services/api";
import { MessageCircle } from "lucide-react";
import { VideoCallModal } from "../../components/chat/VideoCallModal";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "../../context/SocketContext";

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    roomId: string;
    fromName: string;
  } | null>(null);
  const [callType, setCallType] = useState<"video" | "voice">("video");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const { socket, userStatuses } = useSocket();

  useEffect(() => {
    const fetchConversations = async () => {
      if (currentUser) {
        try {
          const data = await messageService.getConversations();
          setConversations(data);
        } catch (error) {
          console.error("Failed to fetch conversations:", error);
        }
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll for new conversations
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (currentUser && userId) {
        try {
          const data = await messageService.getMessages(userId);
          setMessages(data);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      }
    };

    const fetchPartner = async () => {
      if (userId) {
        try {
          const res = await api.get(`/users/${userId}`);
          setChatPartner(res.data);
        } catch (error) {
          console.error("Failed to fetch partner:", error);
        }
      }
    };

    fetchMessages();
    fetchPartner();

    const interval = setInterval(fetchMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [currentUser, userId]);
  useEffect(() => {
    if (socket && currentUser) {
      socket.on(
        "offer",
        (data: { from: string; offer: unknown; roomId: string }) => {
          setIncomingCall({
            roomId: data.roomId,
            fromName: chatPartner?.name || "Incoming Call",
          });
        },
      );

      return () => {
        socket.off("offer");
      };
    }
  }, [socket, currentUser, userId, chatPartner?.name]);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottom.current = isBottom;
  };

  useEffect(() => {
    // Scroll to bottom only if user is already at bottom or if it's a new message from current user
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      (isAtBottom.current || lastMessage.senderId === currentUser?.id)
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentUser]);

  const initiateVideoCall = () => {
    if (userId && currentUser) {
      setCallType("video");
      setShowVideoCall(true);
    }
  };

  const initiateVoiceCall = () => {
    if (userId && currentUser) {
      setCallType("voice");
      setShowVideoCall(true);
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      setShowVideoCall(true);
      // Wait a bit for the modal to mount and register listeners
      setIncomingCall(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !userId) return;

    try {
      const message = await messageService.sendMessage(userId, newMessage);
      setMessages([...messages, message]);
      setNewMessage("");

      // Refresh conversations
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={userStatuses[chatPartner.id]?.status || "offline"}
                  className="mr-3"
                />

                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {chatPartner.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {userStatuses[chatPartner.id]?.status === "online"
                      ? "Online"
                      : userStatuses[chatPartner.id]?.status ===
                          "recently_active"
                        ? `Recently active (${formatDistanceToNow(new Date(userStatuses[chatPartner.id].lastSeen), { addSuffix: true })})`
                        : `Active ${formatDistanceToNow(new Date(userStatuses[chatPartner.id]?.lastSeen || chatPartner.createdAt), { addSuffix: true })}`}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Voice call"
                  onClick={initiateVoiceCall}
                >
                  <Phone size={18} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Video call"
                  onClick={initiateVideoCall}
                >
                  <Video size={18} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Info"
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Messages container */}
            <div
              className="flex-1 p-4 overflow-y-auto bg-gray-50"
              onScroll={handleScroll}
            >
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUser.id;
                    const sender = isCurrentUser ? currentUser : chatPartner;
                    return (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isCurrentUser={isCurrentUser}
                        sender={sender}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">
                    No messages yet
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Add emoji"
                >
                  <Smile size={20} />
                </Button>

                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  fullWidth
                  className="flex-1"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">
              Select a conversation
            </h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>

      {/* Video Call Modal */}
      {showVideoCall && userId && currentUser && (
        <VideoCallModal
          roomId={incomingCall?.roomId || `call-${currentUser.id}-${userId}`}
          targetUserId={userId}
          onClose={() => setShowVideoCall(false)}
          isIncoming={!!incomingCall}
          callType={callType}
        />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-2xl border border-gray-200 rounded-xl p-4 flex items-center space-x-4 animate-bounce">
          <Avatar src="" alt={incomingCall.fromName} size="md" />
          <div>
            <p className="font-bold">{incomingCall.fromName}</p>
            <p className="text-sm text-gray-500">Video calling you...</p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={acceptCall}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIncomingCall(null)}
            >
              Decline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
