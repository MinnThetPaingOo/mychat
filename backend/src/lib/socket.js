import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socket.auth.middleware.js";
import dotenv from "dotenv";
import Message from "../models/Message.js";
dotenv.config();

const app = express();
const server = http.createServer(app);

// Allow both the configured client URL and localhost during dev; add protocol if missing
const rawClient = process.env.CLIENT_URL;
const allowedOrigins = [
  rawClient,
  rawClient && !rawClient.startsWith("http") ? `https://${rawClient}` : null,
  rawClient && !rawClient.startsWith("http") ? `http://${rawClient}` : null,
  "http://localhost:5173",
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // When user comes online, send pending messages and mark as delivered
  socket.on("user_online", async () => {
    try {
      // Find messages sent to this user that are still in "sent" status
      const pendingMessages = await Message.find({
        receiverId: userId,
        status: "sent",
      }).sort({ createdAt: 1 });

      console.log(
        `Found ${pendingMessages.length} pending messages for user ${userId}`
      );

      // Send each pending message and update status
      for (const message of pendingMessages) {
        // Emit the message to the now-online user
        socket.emit("newMessage", message);

        // Update status to delivered
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });

        // Notify the sender if they're online
        const senderSocketId = userSocketMap[message.senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_delivered", {
            messageId: message._id,
          });
        }
      }
    } catch (error) {
      console.error("Error sending pending messages:", error);
    }
  });

  // Listen for message_delivered from Client B
  socket.on(
    "message_delivered",
    async ({ messageId, senderId, receiverId }) => {
      console.log("Received message_delivered:", {
        messageId,
        senderId,
        receiverId,
      }); // Debug log

      try {
        // 1. Update MongoDB status
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { status: "delivered" },
          { new: true }
        );
        console.log("Updated message status:", updatedMessage); // Debug log

        // 2. Notify Client A (sender)
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
          console.log("Emitting to sender:", senderSocketId, messageId); // Debug log
          io.to(senderSocketId).emit("message_delivered", { messageId });
        } else {
          console.log("Sender not online:", senderId); // Debug log
        }
      } catch (error) {
        console.error("Error updating message status:", error);
      }
    }
  );

  // Listen for messages_seen from client
  socket.on("messages_seen", async ({ messageIds, senderId, viewerId }) => {
    console.log("Messages seen:", { messageIds, senderId, viewerId });

    try {
      // Update all message statuses to "seen"
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { status: "seen" }
      );

      console.log(`Updated ${messageIds.length} messages to seen status`);

      // Notify the sender if they're online
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", { messageIds });
        console.log("Notified sender about messages seen:", senderId);
      }
    } catch (error) {
      console.error("Error updating messages to seen:", error);
    }
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
