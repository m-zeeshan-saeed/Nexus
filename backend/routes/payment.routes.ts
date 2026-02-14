import express from "express";
import User from "../models/User.model";
import Transaction from "../models/Transaction.model";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { getSocketId } from "../socket.handler";

const router = express.Router();

// Get wallet balance
router.get("/balance", authenticateToken, async (req: AuthRequest, res) => {
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
});

// Get transaction history
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

// Deposit funds (Simulated)
router.post("/deposit", authenticateToken, async (req: AuthRequest, res) => {
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
});

// Withdraw funds (Simulated)
router.post("/withdraw", authenticateToken, async (req: AuthRequest, res) => {
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
});

// Transfer funds between users
router.post("/transfer", authenticateToken, async (req: AuthRequest, res) => {
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
});

export default router;
