import express from "express";
import User from "../models/User.model";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Get investors
router.get("/investors", authenticateToken, async (req, res) => {
  try {
    const investors = await User.find({ role: "investor" }).select("-password");
    res.json(investors);
  } catch (error) {
    console.error("Fetch investors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get entrepreneurs
router.get("/entrepreneurs", authenticateToken, async (req, res) => {
  try {
    const entrepreneurs = await User.find({ role: "entrepreneur" }).select(
      "-password",
    );
    res.json(entrepreneurs);
  } catch (error) {
    console.error("Fetch entrepreneurs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
