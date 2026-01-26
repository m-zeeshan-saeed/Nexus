import mongoose, { Schema, Document } from "mongoose";
import { CollaborationRequest } from "../../src/types";

export interface ICollaborationRequestDocument
  extends Omit<CollaborationRequest, "id">, Document {
  id: string;
}

const CollaborationRequestSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  investorId: { type: String, required: true },
  entrepreneurId: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: String, required: true },
});

export default mongoose.models.CollaborationRequest ||
  mongoose.model<ICollaborationRequestDocument>(
    "CollaborationRequest",
    CollaborationRequestSchema,
  );
