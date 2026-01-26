import express from "express";
import CollaborationRequest from "../models/CollaborationRequest.model";
import Notification from "../models/Notification.model";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";

const router = express.Router();

// Get requests for current user (as entrepreneur or investor)
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId, role } = req.user!;
    let query = {};

    if (role === "entrepreneur") {
      query = { entrepreneurId: userId };
    } else {
      query = { investorId: userId };
    }

    const requests = await CollaborationRequest.find(query).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (error) {
    console.error("Fetch requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new request
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { entrepreneurId, message } = req.body;
    const { userId: investorId } = req.user!;

    const newRequest = new CollaborationRequest({
      id: `req${Date.now()}`,
      investorId,
      entrepreneurId,
      message,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    await newRequest.save();

    // Create notification for entrepreneur
    const notification = new Notification({
      id: `notif${Date.now()}`,
      userId: entrepreneurId,
      type: "collaboration_request",
      title: "New Collaboration Request",
      message: `An investor has sent you a collaboration request.`,
      link: "/dashboard/entrepreneur",
      isRead: false,
    });
    await notification.save();

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update request status
router.put("/:id/status", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const request = await CollaborationRequest.findOneAndUpdate(
      { id },
      { $set: { status } },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Create notification for the other user
    const targetUserId =
      req.user?.role === "entrepreneur"
        ? request.investorId
        : request.entrepreneurId;
    const notification = new Notification({
      id: `notif${Date.now()}`,
      userId: targetUserId,
      type: status === "accepted" ? "collaboration_accepted" : "meeting_status", // Reusing meeting_status for simplicity or we can add collaboration_rejected
      title: `Collaboration Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your collaboration request has been ${status}.`,
      link:
        req.user?.role === "entrepreneur"
          ? "/dashboard/investor"
          : "/dashboard/entrepreneur",
      isRead: false,
    });
    await notification.save();

    res.json(request);
  } catch (error) {
    console.error("Update request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
