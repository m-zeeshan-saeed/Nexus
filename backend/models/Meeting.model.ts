import mongoose, { Schema, Document } from "mongoose";

export interface IMeeting {
  id: string;
  title: string;
  description?: string;
  investorId: string;
  entrepreneurId: string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  location?: string;
  createdAt: string;
}

export interface IMeetingDocument extends Omit<IMeeting, "id">, Document {
  id: string;
}

const MeetingSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  investorId: { type: String, required: true },
  entrepreneurId: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled"],
    default: "pending",
  },
  location: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Index for conflict detection queries
MeetingSchema.index({ investorId: 1, startTime: 1, endTime: 1 });
MeetingSchema.index({ entrepreneurId: 1, startTime: 1, endTime: 1 });

export default mongoose.models.Meeting ||
  mongoose.model<IMeetingDocument>("Meeting", MeetingSchema);
