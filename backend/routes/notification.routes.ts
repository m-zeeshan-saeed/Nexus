import express from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import Notification from "../models/Notification.model";

const router = express.Router();

// Get all notifications for current user
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notification = await Notification.findOneAndUpdate(
      { id, userId },
      { $set: { isRead: true } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Update notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Read all notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a notification
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notification = await Notification.findOneAndDelete({ id, userId });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
