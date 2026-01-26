import express from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import Document from "../models/Document.model";

const router = express.Router();

// Get all documents for current user
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const documents = await Document.find({ userId }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload a document
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { name, type, size, content, shared } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const newDocument = new Document({
      id: `doc${Date.now()}`,
      userId,
      name,
      type,
      size,
      content,
      shared: shared || false,
    });

    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a document
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const document = await Document.findOneAndDelete({ id, userId });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle document sharing
router.put("/:id/share", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const document = await Document.findOne({ id, userId });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    document.shared = !document.shared;
    await document.save();

    res.json(document);
  } catch (error) {
    console.error("Share document error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
