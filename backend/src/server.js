import express from "express";
import dotenv from "dotenv";

const app = express();
dotenv.config();
const PORT = process.env.PORT;
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

app.get("/", (req, res) => {
  console.log("Received a request at /");
  res.send("Hello, World!");
});
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
