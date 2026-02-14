import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionDocument extends Document {
  id: string; // Custom ID for consistency
  userId: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  recipientId?: string;
  createdAt: string;
}

const TransactionSchema: Schema = new Schema(
  {
    id: { type: String, unique: true, sparse: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["deposit", "withdraw", "transfer"],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    description: { type: String, required: true },
    recipientId: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
  },
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);
