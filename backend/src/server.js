import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import profileRoute from "./routes/profileRoute.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import contactRoute from "./routes/contactRoute.js";
import reactionRoute from "./routes/reactionRoute.js";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const rawClient = process.env.CLIENT_URL;
const allowedOrigins = [
  rawClient,
  rawClient && !rawClient.startsWith("http") ? `https://${rawClient}` : null,
  rawClient && !rawClient.startsWith("http") ? `http://${rawClient}` : null,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // To parse JSON request bodies
app.use(cookieParser()); // To parse cookies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // To parse URL-encoded request bodies

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "API is running...", status: "healthy" });
});
app.use("/api/profile", profileRoute);
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);
app.use("/api/contact", contactRoute);
app.use("/api/reaction", reactionRoute);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
