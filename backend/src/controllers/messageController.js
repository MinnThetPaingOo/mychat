import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import claudinary from "../lib/claudinary.js";
import {
  getReceiverSocketId,
  io,
  isChatOpenWith,
  getSenderSocketId,
} from "../lib/socket.js";

const messageController = {
  sendMessage: async (req, res) => {
    try {
      const senderId = req.user._id;
      const receiverId = req.params.id;
      const { text, attachments } = req.body;

      let uploadedAttachments = [];

      // Process attachments array
      if (attachments && Array.isArray(attachments)) {
        for (const attachment of attachments) {
          const { data, type, name, size } = attachment;

          if (type === "image") {
            const uploadResponse = await claudinary.uploader.upload(data, {
              resource_type: "image",
              folder: "chat_attachments/images",
            });
            uploadedAttachments.push({
              url: uploadResponse.secure_url,
              type: "image",
              name: name || "image",
              size: size || 0,
            });
          } else if (type === "video") {
            const uploadResponse = await claudinary.uploader.upload(data, {
              resource_type: "video",
              folder: "chat_attachments/videos",
            });
            uploadedAttachments.push({
              url: uploadResponse.secure_url,
              type: "video",
              name: name || "video",
              size: size || 0,
            });
          } else if (type === "file") {
            // For files, upload as raw resource with proper options
            const uploadResponse = await claudinary.uploader.upload(data, {
              resource_type: "raw",
              folder: "chat_attachments/files",
              use_filename: true,
              unique_filename: true,
              type: "upload",
            });
            uploadedAttachments.push({
              url: uploadResponse.secure_url,
              type: "file",
              name: name || uploadResponse.original_filename || "file",
              size: size || uploadResponse.bytes || 0,
            });
          }
        }
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        type: "private",
        members: { $all: [senderId, receiverId], $size: 2 },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          type: "private",
          members: [senderId, receiverId],
          lastMessage: null,
        });
        await conversation.save();
      }

      const receiverSocketId = getReceiverSocketId(receiverId);
      let messageStatus = "sent";

      if (receiverSocketId) {
        if (isChatOpenWith(receiverId, senderId.toString())) {
          messageStatus = "seen";
        } else {
          messageStatus = "delivered";
        }
      }
      console.log("Message status set to:", messageStatus);

      const newMessage = new Message({
        conversationId: conversation._id,
        senderId,
        receiverId,
        text,
        attachments: uploadedAttachments,
        status: messageStatus,
      });
      await newMessage.save();

      conversation.lastMessage = newMessage._id;
      await conversation.save();

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);

        const senderSocketId = getSenderSocketId(senderId.toString());
        if (senderSocketId) {
          if (messageStatus === "seen") {
            io.to(senderSocketId).emit("messages_seen", {
              conversationId: conversation._id.toString(),
            });
          } else if (messageStatus === "delivered") {
            io.to(senderSocketId).emit("message_delivered", {
              conversationId: conversation._id.toString(),
            });
          }
        }
      }
      return res.status(200).json({ message: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(400).json({ error: error.message });
    }
  },
  receiveMessage: async (req, res) => {
    // Implement actual receive logic here
    res.send("Receive Message Route123");
  },
  conversations: async (req, res) => {
    try {
      const myId = req.user._id;
      const otherId = req.params.id;
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      });
      if (!messages) {
        return res.status(404).json({ error: "Message not found" });
      }
      return res.status(200).json({ messages });
    } catch (error) {
      return res.status(400).json({ error: error.messages });
    }
  },
  getLastMessage: async (req, res) => {
    try {
      const myId = req.user._id;
      const otherId = req.params.id;
      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;

      const lastMessages = await Message.find({
        $or: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalMessages = await Message.countDocuments({
        $or: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      });

      if (!lastMessages || lastMessages.length === 0) {
        return res.status(404).json({ error: "Messages not found" });
      }

      return res.status(200).json({
        lastMessages,
        hasMore: skip + lastMessages.length < totalMessages,
        totalMessages,
        currentPage: page,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};

export default messageController;
