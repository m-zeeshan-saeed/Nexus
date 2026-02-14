import { Server, Socket } from "socket.io";

interface SignalData {
  roomId: string;
  targetUserId?: string;
  offer?: unknown;
  answer?: unknown;
  candidate?: unknown;
}

const users = new Map<string, string>(); // userId -> socketId
const recentlyActive = new Map<string, NodeJS.Timeout>(); // userId -> timeoutId
const lastSeen = new Map<string, string>(); // userId -> ISO date string

export const getSocketId = (userId: string) => users.get(userId);

type UserStatus = "online" | "offline" | "recently_active";

interface StatusInfo {
  status: UserStatus;
  lastSeen: string;
}

const broadcastStatuses = (io: Server) => {
  const statuses: Record<string, StatusInfo> = {};

  // Combine all known users
  const allUserIds = new Set([
    ...users.keys(),
    ...recentlyActive.keys(),
    ...lastSeen.keys(),
  ]);

  for (const userId of allUserIds) {
    let status: UserStatus = "offline";
    if (users.has(userId)) {
      status = "online";
    } else if (recentlyActive.has(userId)) {
      status = "recently_active";
    }

    statuses[userId] = {
      status,
      lastSeen: lastSeen.get(userId) || new Date().toISOString(),
    };
  }

  io.emit("user-statuses", statuses);
};

export const setupSocketHandlers = (io: Server) => {
  console.log("Socket.IO handlers initialized");

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("setup", (userId: string) => {
      users.set(userId, socket.id);
      lastSeen.set(userId, new Date().toISOString());

      // If they were recently active, clear that timeout
      if (recentlyActive.has(userId)) {
        clearTimeout(recentlyActive.get(userId));
        recentlyActive.delete(userId);
      }

      console.log(`User ${userId} setup with socket ${socket.id}`);
      broadcastStatuses(io);
    });

    // Join a specific chat room
    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
      socket.to(roomId).emit("user-joined", socket.id);
    });

    // WebRTC Signaling: Offer
    socket.on("offer", ({ roomId, targetUserId, offer }: SignalData) => {
      if (targetUserId) {
        const targetSocketId = users.get(targetUserId);
        if (targetSocketId) {
          console.log(
            `Sending offer from ${socket.id} directly to ${targetUserId}`,
          );
          io.to(targetSocketId).emit("offer", {
            from: socket.id,
            offer,
            roomId,
          });
        }
      } else {
        console.log(`Sending offer from ${socket.id} to room ${roomId}`);
        socket.to(roomId).emit("offer", { from: socket.id, offer });
      }
    });

    // WebRTC Signaling: Answer
    socket.on("answer", ({ roomId, targetUserId, answer }: SignalData) => {
      if (targetUserId) {
        const targetSocketId = users.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("answer", {
            from: socket.id,
            answer,
            roomId,
          });
        }
      } else {
        socket.to(roomId).emit("answer", { from: socket.id, answer });
      }
    });

    // WebRTC Signaling: ICE Candidate
    socket.on(
      "ice-candidate",
      ({ roomId, targetUserId, candidate }: SignalData) => {
        if (targetUserId) {
          const targetSocketId = users.get(targetUserId);
          if (targetSocketId) {
            io.to(targetSocketId).emit("ice-candidate", {
              from: socket.id,
              candidate,
              roomId,
            });
          }
        } else {
          socket
            .to(roomId)
            .emit("ice-candidate", { from: socket.id, candidate });
        }
      },
    );

    // Ending the call
    socket.on("end-call", (roomId: string) => {
      console.log(`Call ended in room ${roomId} by ${socket.id}`);
      socket.to(roomId).emit("call-ended", { from: socket.id });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      let disconnectedUserId: string | null = null;

      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          users.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        lastSeen.set(disconnectedUserId, new Date().toISOString());
        // Set to recently active for 5 minutes
        const timeoutId = setTimeout(
          () => {
            recentlyActive.delete(disconnectedUserId!);
            broadcastStatuses(io);
          },
          5 * 60 * 1000,
        ); // 5 minutes

        recentlyActive.set(disconnectedUserId, timeoutId);
      }

      broadcastStatuses(io);
    });
  });
};
