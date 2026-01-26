import mongoose, { Schema, Document } from "mongoose";

export interface INotification {
  id: string;
  userId: string;
  type:
    | "message"
    | "collaboration_request"
    | "collaboration_accepted"
    | "meeting_scheduled"
    | "meeting_status";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface INotificationDocument
  extends Omit<INotification, "id">, Document {
  id: string;
}

const NotificationSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "message",
      "collaboration_request",
      "collaboration_accepted",
      "meeting_scheduled",
      "meeting_status",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Index for fetching notifications for a specific user
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);
