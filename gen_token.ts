import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || "your_fallback_secret";
const token = jwt.sign(
  { userId: "u1771080958847", role: "investor" },
  JWT_SECRET,
);

console.log(token);
