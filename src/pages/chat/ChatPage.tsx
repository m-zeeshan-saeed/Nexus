import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  Phone,
  Video,
  Smile,
  Search,
  Mic,
  X,
  Paperclip,
  CheckCheck,
} from "lucide-react";
import { NewChatModal } from "../../components/chat/NewChatModal";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { Message, ChatConversation, User } from "../../types";
import { messageService } from "../../services/messageService";
import api from "../../services/api";
import { MessageCircle } from "lucide-react";
import { VideoCallModal } from "../../components/chat/VideoCallModal";
import { formatDistanceToNow, format } from "date-fns";
import { useSocket } from "../../context/SocketContext";

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  console.log(
    "ChatPage Render. Current User:",
    currentUser?.id,
    "UserId Param:",
    userId,
  );
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    roomId: string;
    fromName: string;
  } | null>(null);
  const [callType, setCallType] = useState<"video" | "voice">("video");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { socket, userStatuses } = useSocket();

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      if (currentUser) {
        try {
          const data = await messageService.getConversations();
          console.log("Fetched conversations:", data);
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
          console.log("Fetched messages:", data);
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
    // Scroll to bottom ONLY if it's a new message sent by the current user
    // This prevents auto-scrolling on initial load or when reading history
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.senderId === currentUser?.id) {
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

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMessage((prev) =>
        prev ? `${prev}\n[File: ${file.name}]` : `[File: ${file.name}]`,
      );
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop Recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Create blob (unused for now until backend supports upload, but logic is ready)
          // const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setNewMessage((prev) =>
            prev ? `${prev}\n[Voice Message]` : `[Voice Message]`,
          );

          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert(
          "Could not access microphone. Please ensure permissions are granted.",
        );
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !userId) return;

    try {
      const message = await messageService.sendMessage(userId, newMessage);
      setMessages([...messages, message]);
      setNewMessage("");
      setShowEmojiPicker(false);

      // Refresh conversations
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!currentUser) return null;

  const filteredConversations = conversations.filter((c) =>
    c.partner?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white overflow-hidden shadow-xl rounded-xl max-w-7xl mx-auto my-4 border border-gray-200">
      {/* Sidebar - WhatsApp Style */}
      <div className="hidden md:flex flex-col w-[350px] border-r border-gray-200 bg-white">
        {/* Sidebar Header */}
        <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200 h-[60px]">
          <Avatar
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            size="md"
            status="online"
          />
          <div className="flex gap-4 text-gray-600">
            <button title="Status">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-500"></div>
            </button>
            <button title="New Chat" onClick={() => setShowNewChat(true)}>
              <MessageCircle size={24} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-gray-100 bg-white">
          <div className="bg-gray-100 rounded-lg flex items-center px-4 py-2">
            <Search size={20} className="text-gray-500 mr-4" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            <div className="flex flex-col">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() =>
                    conversation.partner?.id &&
                    navigate(`/chat/${conversation.partner.id}`)
                  }
                  className={`flex flex-row items-center p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 ${
                    userId === conversation.partner?.id
                      ? "bg-blue-50/60 border-l-4 border-l-primary-600 shadow-sm"
                      : "border-l-4 border-l-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      src={conversation.partner?.avatarUrl || ""}
                      alt={conversation.partner?.name || "User"}
                      size="lg"
                    />
                    {/* Online Status Indicator */}
                    {userStatuses[conversation.partner?.id || ""]?.status ===
                      "online" && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          userId === conversation.partner?.id
                            ? "text-primary-700"
                            : "text-gray-900"
                        }`}
                      >
                        {conversation.partner?.name || "Unknown User"}
                      </h3>
                      {conversation.updatedAt &&
                        !isNaN(new Date(conversation.updatedAt).getTime()) && (
                          <span
                            className={`text-xs ${
                              userId === conversation.partner?.id
                                ? "text-primary-500 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {format(new Date(conversation.updatedAt), "HH:mm")}
                          </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                        className={`text-sm truncate pr-2 ${
                          conversation.unreadCount > 0
                            ? "font-semibold text-gray-800"
                            : "text-gray-500"
                        }`}
                      >
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 mt-10">
              <p>No conversations yet.</p>
              <p className="text-sm mt-2">
                Search for users to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 relative">
        {chatPartner ? (
          <>
            {/* Chat Header - Customize for Project Look */}
            <div className="bg-white px-6 py-3 border-b border-gray-200 flex justify-between items-center h-[72px] shadow-sm z-10">
              <div className="flex items-center cursor-pointer">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  className="mr-3 ring-2 ring-gray-100"
                />
                <div className="flex flex-col">
                  <span className="text-gray-900 font-semibold text-lg">
                    {chatPartner.name}
                  </span>
                  <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                    {userStatuses[chatPartner.id]?.status === "online" && (
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                    )}
                    {userStatuses[chatPartner.id]?.status === "online"
                      ? "Online"
                      : userStatuses[chatPartner.id]?.status ===
                          "recently_active"
                        ? `Last seen ${
                            userStatuses[chatPartner.id].lastSeen &&
                            !isNaN(
                              new Date(
                                userStatuses[chatPartner.id].lastSeen,
                              ).getTime(),
                            )
                              ? formatDistanceToNow(
                                  new Date(
                                    userStatuses[chatPartner.id].lastSeen,
                                  ),
                                  { addSuffix: true },
                                )
                              : ""
                          }`
                        : "Offline"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initiateVideoCall}
                  className="flex items-center gap-2 text-primary-700 border-primary-200 hover:bg-primary-50"
                >
                  <Video size={18} />
                  <span className="hidden sm:inline">Video Call</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initiateVoiceCall}
                  className="flex items-center gap-2 text-gray-700 border-gray-200 hover:bg-gray-50"
                  title="Voice Call"
                >
                  <Phone size={18} />
                </Button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="relative">
                  {showChatSearch ? (
                    <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 animate-in fade-in slide-in-from-right-4">
                      <Search size={16} className="text-gray-500 mr-2" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm w-32"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        autoFocus
                        onBlur={() =>
                          !chatSearchQuery && setShowChatSearch(false)
                        }
                      />
                      <button
                        onClick={() => {
                          setChatSearchQuery("");
                          setShowChatSearch(false);
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                      title="Search in chat"
                      onClick={() => setShowChatSearch(true)}
                    >
                      <Search size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Background - Clean, no pattern for modern look */}
            <div className="absolute inset-0 z-0 bg-gray-50 pointer-events-none" />

            {/* Messages Container */}
            <div
              className="flex-1 overflow-y-auto p-4 z-10 space-y-2 relative"
              onScroll={handleScroll}
            >
              <div className="flex justify-center mb-6">
                <span className="bg-blue-50 text-xs text-blue-800 px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 text-center max-w-sm">
                  Messages are end-to-end encrypted. No one outside of this
                  chat, not even Business Nexus, can read or listen to them.
                </span>
              </div>

              {messages
                .filter((msg) =>
                  msg.content
                    .toLowerCase()
                    .includes(chatSearchQuery.toLowerCase()),
                )
                .map((message) => {
                  const isCurrentUser = message.senderId === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex w-full ${isCurrentUser ? "justify-end" : "justify-start"} mb-1`}
                    >
                      <div
                        className={`relative max-w-[65%] px-3 py-2 rounded-2xl shadow-sm text-sm ${
                          isCurrentUser
                            ? "bg-primary-600 text-white rounded-br-none"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                        }`}
                      >
                        {/* Removed triangles for cleaner modern UI */}

                        <div className="break-words whitespace-pre-wrap pr-16 min-h-[1.5em]">
                          {message.content}
                        </div>

                        <div className="absolute bottom-1 right-2 flex items-center gap-1">
                          <span
                            className={`text-[10px] ${isCurrentUser ? "text-blue-100" : "text-gray-400"}`}
                          >
                            {message.createdAt &&
                            !isNaN(new Date(message.createdAt).getTime())
                              ? format(new Date(message.createdAt), "HH:mm")
                              : ""}
                          </span>
                          {isCurrentUser && (
                            <CheckCheck size={14} className="text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-gray-100 p-3 flex items-end gap-2 border-t border-gray-200 relative z-20">
              {showEmojiPicker && (
                <div
                  className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-xl border border-gray-100"
                  ref={emojiPickerRef}
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={300}
                    height={400}
                    theme={Theme.LIGHT}
                    searchDisabled={false}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}

              <div className="flex gap-2 mb-2 text-gray-500">
                <button
                  className={`p-2 hover:bg-gray-200 rounded-full transition-colors ${showEmojiPicker ? "text-gray-800 bg-gray-200" : ""}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={24} />
                </button>
                <button
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip size={24} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </button>
              </div>

              <div className="flex-1 bg-white rounded-lg flex items-center overflow-hidden border border-white focus-within:border-white mb-1">
                <form
                  onSubmit={handleSendMessage}
                  className="w-full flex items-center"
                >
                  <input
                    type="text"
                    placeholder="Type a message"
                    className="w-full px-4 py-3 bg-white text-gray-800 outline-none text-sm placeholder-gray-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </form>
              </div>

              <button
                onClick={newMessage.trim() ? handleSendMessage : handleMicClick}
                className={`p-3 rounded-full mb-1 transition-colors ${
                  newMessage.trim() || isRecording
                    ? "bg-primary-600 text-white hover:bg-primary-700 shadow-md"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                {newMessage.trim() ? (
                  <Send size={20} />
                ) : (
                  <Mic
                    size={20}
                    className={isRecording ? "animate-pulse text-red-100" : ""}
                  />
                )}
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center p-10 bg-gray-50 border-b-[6px] border-primary-500">
            <div className="mb-8 p-4">
              {/* Illustration Placeholder - could use an SVG or Image */}
              <div className="w-64 h-64 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle
                  size={100}
                  className="text-gray-400 opacity-50"
                />
              </div>
            </div>
            <h2 className="text-3xl font-light text-gray-700 mb-4">
              Business Nexus Web
            </h2>
            <p className="text-gray-500 text-sm max-w-md text-center leading-relaxed">
              Send and receive messages without keeping your phone online.
              <br />
              Use Business Nexus on up to 4 linked devices and 1 phone.
            </p>
            <div className="mt-10 flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></span>
              End-to-end encrypted
            </div>
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
            <Button
              size="sm"
              onClick={acceptCall}
              className="bg-green-500 hover:bg-green-600"
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIncomingCall(null)}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelectUser={(user) => {
            setShowNewChat(false);
            navigate(`/chat/${user.id}`);
          }}
        />
      )}
    </div>
  );
};
