import React, { useState, useEffect } from "react";
import { X, Search, User as UserIcon } from "lucide-react";
import { userService } from "../../services/userService";
import { User } from "../../types";
import { Avatar } from "../ui/Avatar";

interface NewChatModalProps {
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onSelectUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await userService.searchUsers(searchQuery);
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserIcon size={20} /> New Chat
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-primary-700 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search users..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Avatar src={user.avatarUrl} alt={user.name} size="md" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
