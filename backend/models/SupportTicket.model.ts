import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket {
  id: string;
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface ISupportTicketDocument
  extends Omit<ISupportTicket, "id">, Document {
  id: string;
}

const SupportTicketSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved", "closed"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

// Index for fetching tickets for a specific user
SupportTicketSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicketDocument>("SupportTicket", SupportTicketSchema);
