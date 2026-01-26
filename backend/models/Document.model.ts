import mongoose, { Schema, Document } from "mongoose";

export interface IDocument {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: string;
  content: string; // Base64 content
  shared: boolean;
  createdAt: string;
}

export interface IDocumentDocument extends Omit<IDocument, "id">, Document {
  id: string;
}

const DocumentSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: String, required: true },
  content: { type: String, required: true },
  shared: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Index for fetching documents for a specific user
DocumentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Document ||
  mongoose.model<IDocumentDocument>("Document", DocumentSchema);
