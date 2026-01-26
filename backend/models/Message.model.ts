import mongoose, { Schema, Document } from "mongoose";
import { Message } from "../../src/types";

export interface IMessageDocument extends Omit<Message, "id">, Document {
  id: string;
}

const MessageSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  isRead: { type: Boolean, default: false },
});

export default mongoose.models.Message ||
  mongoose.model<IMessageDocument>("Message", MessageSchema);
