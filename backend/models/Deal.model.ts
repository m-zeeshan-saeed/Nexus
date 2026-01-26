import mongoose, { Schema, Document } from "mongoose";

export interface IDeal {
  id: string;
  investorId: string;
  entrepreneurId: string;
  amount: string;
  equity: string;
  status: "Due Diligence" | "Term Sheet" | "Negotiation" | "Closed" | "Passed";
  stage: string;
  notes?: string;
  createdAt: string;
  lastActivity: string;
}

export interface IDealDocument extends Omit<IDeal, "id">, Document {
  id: string;
}

const DealSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  investorId: { type: String, required: true },
  entrepreneurId: { type: String, required: true },
  amount: { type: String, required: true },
  equity: { type: String, required: true },
  status: {
    type: String,
    enum: ["Due Diligence", "Term Sheet", "Negotiation", "Closed", "Passed"],
    default: "Due Diligence",
  },
  stage: { type: String, required: true },
  notes: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  lastActivity: { type: String, default: () => new Date().toISOString() },
});

// Index for fetching deals for a specific investor
DealSchema.index({ investorId: 1, lastActivity: -1 });

export default mongoose.models.Deal ||
  mongoose.model<IDealDocument>("Deal", DealSchema);
