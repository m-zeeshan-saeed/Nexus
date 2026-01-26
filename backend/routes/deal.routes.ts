import express from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import Deal from "../models/Deal.model";

const router = express.Router();

// Get all deals for current investor
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const deals = await Deal.find({ investorId: userId }).sort({
      lastActivity: -1,
    });
    res.json(deals);
  } catch (error) {
    console.error("Fetch deals error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new deal
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { entrepreneurId, amount, equity, status, stage, notes } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const newDeal = new Deal({
      id: `deal${Date.now()}`,
      investorId: userId,
      entrepreneurId,
      amount,
      equity,
      status: status || "Due Diligence",
      stage,
      notes,
    });

    await newDeal.save();
    res.status(201).json(newDeal);
  } catch (error) {
    console.error("Create deal error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a deal
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Update lastActivity timestamp
    updates.lastActivity = new Date().toISOString();

    const deal = await Deal.findOneAndUpdate(
      { id, investorId: userId },
      { $set: updates },
      { new: true },
    );

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.json(deal);
  } catch (error) {
    console.error("Update deal error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a deal
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const deal = await Deal.findOneAndDelete({ id, investorId: userId });

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.json({ message: "Deal deleted" });
  } catch (error) {
    console.error("Delete deal error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
