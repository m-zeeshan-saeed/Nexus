import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./socket.handler.js";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import collaborationRoutes from "./routes/collaboration.routes";
import directoryRoutes from "./routes/directory.routes";
import meetingRoutes from "./routes/meeting.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import documentRoutes from "./routes/document.routes";
import dealRoutes from "./routes/deal.routes";
import supportRoutes from "./routes/support.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();
const port = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGODB_URL;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// MongoDB connection
if (!MONGO_URL) {
  throw new Error("Please provide MONGODB_URL in the environment variables");
}

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/directory", directoryRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this for production
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// Setup socket handlers
setupSocketHandlers(io);

// Start the server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
