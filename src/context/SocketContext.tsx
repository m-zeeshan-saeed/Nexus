/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  userStatuses: Record<
    string,
    { status: "online" | "offline" | "recently_active"; lastSeen: string }
  >;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  userStatuses: {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [userStatuses, setUserStatuses] = useState<
    Record<
      string,
      { status: "online" | "offline" | "recently_active"; lastSeen: string }
    >
  >({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:3001";
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      newSocket.on("get-online-users", (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on(
        "user-statuses",
        (
          statuses: Record<
            string,
            {
              status: "online" | "offline" | "recently_active";
              lastSeen: string;
            }
          >,
        ) => {
          setUserStatuses(statuses);
        },
      );

      newSocket.on(
        "payment_received",
        (data: { amount: number; senderName: string }) => {
          toast.success(
            `Received $${data.amount.toLocaleString()} from ${data.senderName}`,
            {
              duration: 5000,
              icon: "💰",
            },
          );
          // Dispatch custom event for dashboards to refresh data
          window.dispatchEvent(new CustomEvent("payment-updated"));
        },
      );

      newSocket.emit("setup", user.id);

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, userStatuses }}>
      {children}
    </SocketContext.Provider>
  );
};
