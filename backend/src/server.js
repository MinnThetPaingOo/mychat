import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import contactRoute from "./routes/contactRoute.js";
import { connectDB } from "./lib/db.js";
import arjectMiddleware from "./middlewares/arjectMiddleware.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;

// CORS configuration for local dev and production
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://mychatlist.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));
// Handle preflight safely without path-to-regexp wildcards
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  return next();
});
app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies
// app.use(arjectMiddleware);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "API is running...", status: "healthy" });
});
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);
app.use("/api/contact", contactRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
