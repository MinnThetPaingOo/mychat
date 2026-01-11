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
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export const getSenderSocketId = (senderId) => {
  return userSocketMap[senderId];
};

// In-memory store for which user has which chat open { userId: withUserId }
const userOpenChatMap = {};

/**
 * Checks if a user has a specific chat window open.
 * @param {string} userId - The user to check.
 * @param {string} withUserId - The other user in the chat.
 * @returns {boolean} - True if the chat is open.
 */
export function isChatOpenWith(userId, withUserId) {
  return userOpenChatMap[userId] === withUserId;
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // track when a user opens or closes a chat (in-memory only)
  socket.on("chat_open", ({ withUserId }) => {
    userOpenChatMap[userId] = withUserId;
  });

  socket.on("chat_close", () => {
    delete userOpenChatMap[userId];
  });

  // When user comes online, send pending messages and mark as delivered
  socket.on("user_online", async () => {
    try {
      // Find messages sent to this user that are still in "sent" status
      const pendingMessages = await Message.find({
        receiverId: userId,
        status: "sent",
      }).sort({ createdAt: 1 });

      // Send each pending message, update status and notify sender
      for (const message of pendingMessages) {
        socket.emit("newMessage", message);
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

  // Listen for messages_seen from client
  socket.on("messages_seen", async ({ messageIds, senderId, viewerId }) => {
    try {
      // Update all message statuses to "seen"
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { status: "seen" }
      );
      // Notify the sender if they're online
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", { messageIds });
      }
    } catch (error) {
      console.error("Error updating messages to seen:", error);
    }
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    delete userOpenChatMap[userId]; // Clean up open chat status on disconnect
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
