import express, { Response } from "express";
import User from "../models/User.model";
import Transaction from "../models/Transaction.model";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { getSocketId } from "../socket.handler";
import {
  transactionSchema,
  validateRequest,
} from "../middlewares/validation.middleware";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Payments
 *   description: Wallet and transaction management
 */

/**
 * @openapi
 * /payments/balance:
 *   get:
 *     summary: Get user wallet balance
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 */
router.get(
  "/balance",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findOne({ id: req.user?.userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ balance: user.walletBalance || 0 });
    } catch (error) {
      console.error("Fetch balance error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * @openapi
 * /payments/transactions:
 *   get:
 *     summary: Get user transaction history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get(
  "/transactions",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const transactions = await Transaction.find({
        userId: req.user?.userId,
      }).sort({
        createdAt: -1,
      });
      res.json(transactions);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * @openapi
 * /payments/deposit:
 *   post:
 *     summary: Deposit funds into wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deposit successful
 */
router.post(
  "/deposit",
  authenticateToken,
  transactionSchema,
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, method } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await User.findOne({ id: req.user?.userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update balance
      user.walletBalance = (user.walletBalance || 0) + amount;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        id: `tx${Date.now()}`,
        userId: user.id,
        type: "deposit",
        amount,
        status: "completed",
        description: `Deposit via ${method || "Card"}`,
      });
      await transaction.save();

      res.json({
        message: "Deposit successful",
        balance: user.walletBalance,
        transaction,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * @openapi
 * /payments/withdraw:
 *   post:
 *     summary: Withdraw funds from wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal successful
 */
router.post(
  "/withdraw",
  authenticateToken,
  transactionSchema,
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, method } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await User.findOne({ id: req.user?.userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.walletBalance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Update balance
      user.walletBalance -= amount;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        id: `tx${Date.now()}`,
        userId: user.id,
        type: "withdraw",
        amount,
        status: "completed",
        description: `Withdrawal to ${method || "Bank Account"}`,
      });
      await transaction.save();

      res.json({
        message: "Withdrawal successful",
        balance: user.walletBalance,
        transaction,
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * @openapi
 * /payments/transfer:
 *   post:
 *     summary: Transfer funds to another user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - amount
 *             properties:
 *               recipientId:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer successful
 */
router.post(
  "/transfer",
  authenticateToken,
  transactionSchema,
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { recipientId, amount, description } = req.body;
      const { userId: senderId } = req.user!;

      console.log("Transfer Start:", { senderId, recipientId, amount });

      if (!amount || amount <= 0 || !recipientId) {
        console.log("Transfer Validation Failed:", { recipientId, amount });
        return res.status(400).json({ message: "Invalid transfer details" });
      }

      if (recipientId === senderId) {
        console.log("Self-transfer Attempt:", senderId);
        return res.status(400).json({ message: "Cannot transfer to yourself" });
      }

      const sender = await User.findOne({ id: senderId });
      const recipient = await User.findOne({ id: recipientId });

      if (!sender || !recipient) {
        console.log("Users not found:", {
          sender: !!sender,
          recipient: !!recipient,
        });
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Balances Before:", {
        sender: sender.walletBalance,
        recipient: recipient.walletBalance,
      });

      if (sender.walletBalance < amount) {
        console.log("Insufficient Funds:", {
          balance: sender.walletBalance,
          amount,
        });
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Update balances
      sender.walletBalance -= amount;
      recipient.walletBalance = (recipient.walletBalance || 0) + amount;

      await sender.save();
      await recipient.save();

      console.log("Balances After:", {
        sender: sender.walletBalance,
        recipient: recipient.walletBalance,
      });

      // Create transaction records for both
      const senderTransaction = new Transaction({
        id: `tx${Date.now()}-S`,
        userId: sender.id,
        type: "transfer",
        amount: -amount,
        status: "completed",
        description: description || `Transfer to ${recipient.name}`,
        recipientId: recipient.id,
      });

      const recipientTransaction = new Transaction({
        id: `tx${Date.now()}-R`,
        userId: recipient.id,
        type: "transfer",
        amount: amount,
        status: "completed",
        description: description || `Transfer from ${sender.name}`,
        recipientId: sender.id,
      });

      await senderTransaction.save();
      await recipientTransaction.save();

      console.log("Transactions Saved:", {
        senderTx: senderTransaction.id,
        recipientTx: recipientTransaction.id,
      });

      // Notify recipient via socket if online
      const io = req.app.get("io");
      if (io) {
        const recipientSocketId = getSocketId(recipient.id);
        if (recipientSocketId) {
          console.log("Emitting payment_received to:", recipientSocketId);
          io.to(recipientSocketId).emit("payment_received", {
            amount,
            senderName: sender.name,
            transaction: recipientTransaction.toObject(),
          });
        }
      }

      res.json({
        message: "Transfer successful",
        balance: sender.walletBalance,
        transaction: senderTransaction,
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
