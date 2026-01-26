import mongoose, { Schema, Document } from "mongoose";
import { User } from "../../src/types";

export interface IUserDocument extends Omit<User, "id">, Document {
  id: string; // Keep the 'id' field for compatibility with frontend mock data
  password: string;
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: string;
  industry?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
  investmentInterests?: string[];
  investmentStage?: string[];
  portfolioCompanies?: string[];
  totalInvestments?: number;
  minimumInvestment?: string;
  maximumInvestment?: string;
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["entrepreneur", "investor"], required: true },
    avatarUrl: { type: String, default: "https://via.placeholder.com/150" },
    bio: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },

    // Entrepreneur fields
    startupName: { type: String },
    pitchSummary: { type: String },
    fundingNeeded: { type: String },
    industry: { type: String },
    location: { type: String },
    foundedYear: { type: Number },
    teamSize: { type: Number },

    // Investor fields
    investmentInterests: [{ type: String }],
    investmentStage: [{ type: String }],
    portfolioCompanies: [{ type: String }],
    totalInvestments: { type: Number },
    minimumInvestment: { type: String },
    maximumInvestment: { type: String },
  },
  {
    timestamps: false, // Using custom createdAt from mock data
  },
);

export default mongoose.models.User ||
  mongoose.model<IUserDocument>("User", UserSchema);
