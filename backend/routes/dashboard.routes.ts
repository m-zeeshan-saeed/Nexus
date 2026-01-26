import express from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import User from "../models/User.model";
import Collaboration from "../models/CollaborationRequest.model";
import Meeting, { IMeetingDocument } from "../models/Meeting.model";
import Message from "../models/Message.model";
const router = express.Router();

interface DashboardStats {
  pendingRequests: number;
  totalConnections: number;
  upcomingMeetings: number;
  unreadMessages: number;
  recentActivity: unknown[];
  meetings?: IMeetingDocument[];
  profileViews?: number;
  totalStartups?: number;
}

// Get dashboard summary data
router.get("/summary", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Basic stats
    const stats: DashboardStats = {
      pendingRequests: 0,
      totalConnections: 0,
      upcomingMeetings: 0,
      unreadMessages: 0,
      recentActivity: [],
    };

    // 1. Get Collaboration Stats
    const collaborations = await Collaboration.find({
      $or: [{ investorId: userId }, { entrepreneurId: userId }],
    });

    stats.pendingRequests = collaborations.filter(
      (c) =>
        c.status === "pending" &&
        (userRole === "entrepreneur" ? c.entrepreneurId === userId : true),
    ).length;
    stats.totalConnections = collaborations.filter(
      (c) => c.status === "accepted",
    ).length;

    // 2. Get Unread Messages
    stats.unreadMessages = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    // 2. Get Upcoming Meetings
    const now = new Date().toISOString();
    const meetings = await Meeting.find({
      $or: [{ investorId: userId }, { entrepreneurId: userId }],
      startTime: { $gte: now },
      status: "accepted",
    })
      .sort({ startTime: 1 })
      .limit(5);

    stats.upcomingMeetings = await Meeting.countDocuments({
      $or: [{ investorId: userId }, { entrepreneurId: userId }],
      startTime: { $gte: now },
      status: "accepted",
    });

    stats.meetings = meetings;

    // 3. Role specific data
    if (userRole === "entrepreneur") {
      stats.profileViews = 24 + Math.floor(Math.random() * 10);
    } else {
      stats.totalStartups = await User.countDocuments({ role: "entrepreneur" });
    }

    res.json(stats);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
