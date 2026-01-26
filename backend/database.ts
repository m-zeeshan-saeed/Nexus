import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { entrepreneurs, investors } from "../src/data/users";
import { messages } from "../src/data/messages";
import { collaborationRequests } from "../src/data/collaborationRequests";

import User from "./models/User.model";
import Message from "./models/Message.model";
import CollaborationRequest from "./models/CollaborationRequest.model";

dotenv.config();

const MONGO_URL = process.env.MONGODB_URL;

if (!MONGO_URL) {
  console.error("MONGODB_URL not found in .env");
  process.exit(1);
}

async function database() {
  try {
    await mongoose.connect(MONGO_URL as string);
    console.log("Connected to MongoDB for database...");

    // Clear existing data
    await User.deleteMany({});
    await Message.deleteMany({});
    await CollaborationRequest.deleteMany({});
    console.log("Cleared existing collections.");

    // Hash a default password for all mock users
    const defaultPassword = await bcrypt.hash("password123", 10);

    // Seed Users
    const allUsers = [...entrepreneurs, ...investors].map((user) => ({
      ...user,
      password: defaultPassword,
    }));

    await User.insertMany(allUsers);
    console.log(
      `Successfully added ${allUsers.length} users with hashed passwords.`,
    );

    // Seed Messages
    await Message.insertMany(messages);
    console.log(`Successfully added ${messages.length} messages.`);

    // Seed Collaboration Requests
    await CollaborationRequest.insertMany(collaborationRequests);
    console.log(
      `Successfully added ${collaborationRequests.length} collaboration requests.`,
    );

    console.log("Database added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding to database:", error);
    process.exit(1);
  }
}

database();
