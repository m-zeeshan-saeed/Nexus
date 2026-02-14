import express, { Response } from "express";
import User from "../models/User.model";
import CollaborationRequest from "../models/CollaborationRequest.model";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import {
  profileUpdateSchema,
  changePasswordSchema,
  validateRequest,
} from "../middlewares/validation.middleware";
import bcrypt from "bcryptjs";

const router = express.Router();

/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *       401:
 *         description: Unauthorized
 */
// Get current user profile
router.get(
  "/profile",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
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
  },
);

/**
 * @openapi
 * /users/search:
 *   get:
 *     summary: Search users by name, email, or ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users matching query
 */
// Search users by name, email, or ID
router.get(
  "/search",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Search for users by direct ID match or case-insensitive name/email match
      // Filter out the current user from results
      const users = await User.find({
        $and: [
          { id: { $ne: req.user?.userId } },
          {
            $or: [
              { id: query },
              { name: { $regex: query, $options: "i" } },
              { email: { $regex: query, $options: "i" } },
            ],
          },
        ],
      })
        .select("id name email role")
        .limit(10);

      res.json(users);
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * @openapi
 * /users/connections:
 *   get:
 *     summary: Get connected users (accepted collaborations)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected users
 */
// Get connected users (accepted collaborations)
router.get(
  "/connections",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.user!;
      console.log("[DEBUG] /connections - fetching for user:", userId);

      const acceptedRequests = await CollaborationRequest.find({
        status: "accepted",
        $or: [{ investorId: userId }, { entrepreneurId: userId }],
      });

      console.log(
        "[DEBUG] /connections - accepted requests count:",
        acceptedRequests.length,
      );

      const partnerIds = acceptedRequests.map((req) =>
        req.investorId === userId ? req.entrepreneurId : req.investorId,
      );

      console.log("[DEBUG] /connections - unique partner IDs:", [
        ...new Set(partnerIds),
      ]);

      const connections = await User.find({ id: { $in: partnerIds } })
        .select("id name email role avatarUrl startupName industry")
        .lean();

      console.log("[DEBUG] /connections - users found:", connections.length);

      res.json(connections);
    } catch (error) {
      console.error("Fetch connections error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

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
router.put(
  "/profile",
  authenticateToken,
  profileUpdateSchema,
  validateRequest,
  async (req: AuthRequest, res: Response) => {
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
  },
);

// Change password
router.put(
  "/change-password",
  authenticateToken,
  changePasswordSchema,
  validateRequest,
  async (req: AuthRequest, res: Response) => {
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
