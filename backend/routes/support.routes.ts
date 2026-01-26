import express from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import SupportTicket from "../models/SupportTicket.model";

const router = express.Router();

// Get all tickets for current user
router.get("/tickets", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const tickets = await SupportTicket.find({ userId }).sort({
      createdAt: -1,
    });
    res.json(tickets);
  } catch (error) {
    console.error("Fetch tickets error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new support ticket
router.post("/tickets", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { name, email, subject, message, priority } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const newTicket = new SupportTicket({
      id: `ticket${Date.now()}`,
      userId,
      name,
      email,
      subject: subject || "Support Request",
      message,
      priority: priority || "medium",
      status: "open",
    });

    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update ticket status (could be used by admin in future)
router.put("/tickets/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status, priority } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    const ticket = await SupportTicket.findOneAndUpdate(
      { id, userId },
      { $set: updates },
      { new: true },
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
