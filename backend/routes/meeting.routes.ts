import express from "express";
import Meeting from "../models/Meeting.model";
import Notification from "../models/Notification.model";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";

const router = express.Router();

// Get all meetings for current user
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const meetings = await Meeting.find({
      $or: [{ investorId: userId }, { entrepreneurId: userId }],
    }).sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    console.error("Fetch meetings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Schedule a meeting
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      entrepreneurId,
      investorId,
      startTime,
      endTime,
      location,
    } = req.body;

    // Validate that the request involves the current user
    const currentUserId = req.user?.userId;
    if (currentUserId !== entrepreneurId && currentUserId !== investorId) {
      return res
        .status(403)
        .json({ message: "You can only schedule meetings for yourself" });
    }

    // Conflict detection for both parties
    const conflict = await Meeting.findOne({
      $or: [
        { investorId },
        { entrepreneurId },
        { investorId: entrepreneurId }, // In case entrepreneur is also an investor in another context
        { entrepreneurId: investorId }, // In case investor is also an entrepreneur in another context
      ],
      status: { $in: ["accepted", "pending"] },
      $and: [{ startTime: { $lt: endTime } }, { endTime: { $gt: startTime } }],
    });

    if (conflict) {
      return res.status(409).json({
        message:
          "Conflict detected. One of the participants already has a meeting or request during this time.",
        conflict: {
          title: conflict.title,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      });
    }

    const newMeeting = new Meeting({
      id: `m${Date.now()}`,
      title,
      description,
      investorId,
      entrepreneurId,
      startTime,
      endTime,
      location,
      status: "pending",
    });

    await newMeeting.save();

    // Create notification for the other participant
    const targetUserId =
      currentUserId === entrepreneurId ? investorId : entrepreneurId;
    const notification = new Notification({
      id: `notif${Date.now()}`,
      userId: targetUserId,
      type: "meeting_scheduled",
      title: "New Meeting Scheduled",
      message: `A new meeting "${title}" has been scheduled with you.`,
      link: "/meetings",
      isRead: false,
    });
    await notification.save();

    res.status(201).json(newMeeting);
  } catch (error) {
    console.error("Schedule meeting error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update meeting status (accept/reject/cancel)
router.put("/:id/status", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!["accepted", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const meeting = await Meeting.findOne({ id: req.params.id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Authorization checks
    if (status === "cancelled") {
      if (meeting.investorId !== userId && meeting.entrepreneurId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
    } else {
      // Only the recipient of the invitation (or the other party) should ideally accept/reject
      // But for simplicity, we allow either party to manage their status if they are involved
      if (meeting.investorId !== userId && meeting.entrepreneurId !== userId) {
        return res.status(403).json({ message: "Permission denied" });
      }
    }

    meeting.status = status;
    await meeting.save();

    // Create notification for the other user
    const targetUserId =
      userId === meeting.investorId
        ? meeting.entrepreneurId
        : meeting.investorId;
    const notification = new Notification({
      id: `notif${Date.now()}`,
      userId: targetUserId,
      type: "meeting_status",
      title: `Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `The status of your meeting "${meeting.title}" has been updated to ${status}.`,
      link: "/meetings",
      isRead: false,
    });
    await notification.save();

    res.json(meeting);
  } catch (error) {
    console.error("Update meeting status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single meeting
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const meeting = await Meeting.findOne({
      id: req.params.id,
      $or: [{ investorId: userId }, { entrepreneurId: userId }],
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    console.error("Fetch meeting error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
