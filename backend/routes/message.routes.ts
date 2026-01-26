import express from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import Message from "../models/Message.model";
import User from "../models/User.model";
import Notification from "../models/Notification.model";

const router = express.Router();

// Get conversations for current user
router.get(
  "/conversations",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Find all messages involving the user
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      }).sort({ timestamp: -1 });

      // Group by conversation partner
      const conversationsMap = new Map();

      for (const msg of messages) {
        const partnerId =
          msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!conversationsMap.has(partnerId)) {
          // Fetch partner info
          const partner = await User.findOne({ id: partnerId }).select(
            "name avatarUrl isOnline",
          );
          if (partner) {
            conversationsMap.set(partnerId, {
              id: `conv-${userId}-${partnerId}`,
              participants: [userId, partnerId],
              partner: {
                id: partnerId,
                name: partner.name,
                avatarUrl: partner.avatarUrl,
                isOnline: partner.isOnline,
              },
              lastMessage: msg,
              updatedAt: msg.timestamp,
            });
          }
        }
      }

      res.json(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Fetch conversations error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get total unread count
router.get(
  "/unread-count",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const count = await Message.countDocuments({
        receiverId: userId,
        isRead: false,
      });

      res.json({ count });
    } catch (error) {
      console.error("Fetch unread count error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get messages between two users
router.get("/:partnerId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const partnerId = req.params.partnerId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    // Mark as read
    await Message.updateMany(
      { senderId: partnerId, receiverId: userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a message
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { receiverId, content } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const newMessage = new Message({
      id: `m${Date.now()}`,
      senderId: userId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    });

    await newMessage.save();

    // Create notification for receiver
    const sender = await User.findOne({ id: userId }).select("name");
    const notification = new Notification({
      id: `notif${Date.now()}`,
      userId: receiverId,
      type: "message",
      title: "New Message",
      message: `You have received a new message from ${sender?.name || "someone"}.`,
      link: `/chat/${userId}`,
      isRead: false,
    });
    await notification.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
