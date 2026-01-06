import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import claudinary from "../lib/claudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const messageController = {
  sendMessage: async (req, res) => {
    try {
      const senderId = req.user._id;
      const receiverId = req.params.id;
      const { text, image, video } = req.body;
      let imageUrl, videoUrl;
      if (image) {
        //upload imagebase64 to cloudinary
        const uploadResponse = await claudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }
      if (video) {
        //upload video base64 to cloudinary
        const uploadResponse = await claudinary.uploader.upload(video, {
          resource_type: "video",
        });
        videoUrl = uploadResponse.secure_url;
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

      const newMessage = new Message({
        conversationId: conversation._id,
        senderId,
        receiverId,
        text,
        image: imageUrl,
        video: videoUrl,
      });
      await newMessage.save();

      // Update lastMessage in conversation
      conversation.lastMessage = newMessage._id;
      await conversation.save();

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      return res.status(200).json({ message: newMessage });
    } catch (error) {
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
};

export default messageController;
