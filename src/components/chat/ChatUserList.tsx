import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ChatConversation } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

interface ChatUserListProps {
  conversations: ChatConversation[];
}

export const ChatUserList: React.FC<ChatUserListProps> = ({
  conversations,
}) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { userStatuses } = useSocket();
  const { user: currentUser } = useAuth();

  if (!currentUser) return null;

  const handleSelectUser = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-64 overflow-y-auto">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">
          Messages
        </h2>

        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              const otherUser = conversation.partner;
              if (!otherUser) return null;

              const lastMessage = conversation.lastMessage;
              const isActive = activeUserId === otherUser.id;
              const statusInfo = userStatuses[otherUser.id];
              const status = statusInfo?.status || "offline";

              return (
                <div
                  key={conversation.id}
                  className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? "bg-primary-50 border-l-4 border-primary-600"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                  onClick={() => handleSelectUser(otherUser.id)}
                >
                  <Avatar
                    src={otherUser.avatarUrl}
                    alt={otherUser.name}
                    size="md"
                    status={status}
                    className="mr-3 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherUser.name}
                      </h3>

                      {/* Assuming ChatConversation now has an 'updatedAt' field */}
                      {/* The original snippet was syntactically incorrect,
                          this change assumes the intent was to use conversation.updatedAt */}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.updatedAt), {
                          addSuffix: false,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      {lastMessage && (
                        <p className="text-xs text-gray-600 truncate">
                          {lastMessage.senderId === currentUser.id
                            ? "You: "
                            : ""}
                          {lastMessage.content}
                        </p>
                      )}

                      {lastMessage &&
                        !lastMessage.isRead &&
                        lastMessage.senderId !== currentUser.id && (
                          <Badge variant="primary" size="sm" rounded>
                            New
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
