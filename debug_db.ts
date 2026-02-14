import mongoose from "mongoose";
import "dotenv/config";

const mongoUri = process.env.MONGODB_URL;

async function debug() {
  await mongoose.connect(mongoUri!);
  const User = mongoose.connection.collection("users");
  const user = await User.findOne({ id: "u1771080958847" });
  console.log("Saeed Email:", user?.email);
  process.exit(0);
}

debug();
