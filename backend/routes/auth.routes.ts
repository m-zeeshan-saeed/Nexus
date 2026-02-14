import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import {
  registerSchema,
  loginSchema,
  validateRequest,
} from "../middlewares/validation.middleware";
import { sendOTP, sendResetPasswordEmail } from "../services/emailService";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_fallback_secret";

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [entrepreneur, investor] }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
// User Registration
router.post("/register", registerSchema, validateRequest, async (req, res) => {
  try {
    const { name, email, password, role, ...extraInfo } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      id: `u${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role,
      avatarUrl: extraInfo.avatarUrl || "https://via.placeholder.com/150",
      bio: extraInfo.bio || "",
      createdAt: new Date().toISOString(),
      ...extraInfo,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user and return token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid email or password
 */
// User Login
router.post("/login", loginSchema, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Login failed: User not found");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Login failed: Wrong password");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check for 2FA
    if (user.isTwoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP and expiry in user doc for this session (mock approach)
      await User.findOneAndUpdate(
        { id: user.id },
        {
          $set: {
            twoFactorSecret: otp, // Using this field temporarily for the mockup OTP
          },
        },
      );

      await sendOTP(user.email, otp);

      const tempToken = jwt.sign(
        { userId: user.id, isTemp: true },
        JWT_SECRET,
        {
          expiresIn: "5m",
        },
      );

      return res.json({
        requires2FA: true,
        tempToken,
        email: user.email,
      });
    }

    // Create JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("Login successful for:", email);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *       404:
 *         description: User not found
 */
// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "10m",
    });

    await sendResetPasswordEmail(user.email, resetToken);

    res.json({ message: "Password reset instructions sent", resetToken });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { id: decoded.userId },
      { $set: { password: hashedPassword } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// 2FA Setup - Send OTP to email
router.post("/2fa/setup", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findOne({ id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await User.findOneAndUpdate(
      { id: userId },
      { $set: { twoFactorSecret: otp } },
    );

    await sendOTP(user.email, otp);
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2FA Verify & Enable
router.post("/2fa/enable", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user?.userId;
    const user = await User.findOne({ id: userId });

    if (!user || user.twoFactorSecret !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await User.findOneAndUpdate(
      { id: userId },
      {
        $set: { isTwoFactorEnabled: true },
        $unset: { twoFactorSecret: "" },
      },
    );

    res.json({ message: "Two-factor authentication enabled successfully" });
  } catch (error) {
    console.error("2FA enable error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2FA Disable
router.post(
  "/2fa/disable",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      await User.findOneAndUpdate(
        { id: userId },
        { $set: { isTwoFactorEnabled: false } },
      );
      res.json({ message: "Two-factor authentication disabled" });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// 2FA Validate during login
router.post("/2fa/validate-login", async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    const decoded = jwt.verify(tempToken, JWT_SECRET) as {
      userId: string;
      isTemp: boolean;
    };
    if (!decoded.isTemp) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const user = await User.findOne({ id: decoded.userId });
    if (!user || user.twoFactorSecret !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Success - Clear temp OTP and return final JWT
    await User.findOneAndUpdate(
      { id: user.id },
      { $unset: { twoFactorSecret: "" } },
    );

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("2FA validation error:", error);
    res.status(401).json({ message: "Session expired or invalid" });
  }
});

export default router;
