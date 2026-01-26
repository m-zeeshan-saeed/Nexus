import express from "express";
import User from "../models/User.model";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import bcrypt from "bcryptjs";

const router = express.Router();

// Get current user profile
router.get("/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findOne({ id: req.user?.userId }).select(
      "-password",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Fetch profile by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updates = req.body;

    // Prevent sensitive fields from being updated directly here
    delete updates.password;
    delete updates.email;
    delete updates.id;
    delete updates.role;

    const user = await User.findOneAndUpdate(
      { id: req.user?.userId },
      { $set: updates },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put(
  "/change-password",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      const user = await User.findOne({ id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
