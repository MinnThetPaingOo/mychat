import Message from "../models/Message.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const reactionController = {
  addReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { reactionType } = req.body; // "like", "love", "haha", "wow", "sad", "angry"
      const userId = req.user._id;

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Find if this reaction type already exists
      let reactionIndex = message.reactions.findIndex(
        (r) => r.type === reactionType
      );

      if (reactionIndex !== -1) {
        // Reaction type exists
        const userIndex =
          message.reactions[reactionIndex].users.indexOf(userId);

        if (userIndex !== -1) {
          // User already reacted with this type - remove it
          message.reactions[reactionIndex].users.splice(userIndex, 1);
          message.reactions[reactionIndex].count -= 1;

          // Remove reaction type if no users left
          if (message.reactions[reactionIndex].count === 0) {
            message.reactions.splice(reactionIndex, 1);
          }
        } else {
          // User hasn't reacted with this type - add user
          message.reactions[reactionIndex].users.push(userId);
          message.reactions[reactionIndex].count += 1;
        }
      } else {
        // Reaction type doesn't exist - create new
        message.reactions.push({
          type: reactionType,
          count: 1,
          users: [userId],
        });
      }

      // Remove user from other reaction types (user can only react once)
      message.reactions.forEach((reaction, index) => {
        if (reaction.type !== reactionType) {
          const userIdx = reaction.users.indexOf(userId);
          if (userIdx !== -1) {
            reaction.users.splice(userIdx, 1);
            reaction.count -= 1;
          }
        }
      });

      // Clean up empty reactions
      message.reactions = message.reactions.filter((r) => r.count > 0);

      await message.save();

      // Emit to both sender and receiver
      const receiverId =
        message.senderId.toString() === userId.toString()
          ? message.receiverId
          : message.senderId;

      const receiverSocketId = getReceiverSocketId(receiverId);
      const emitData = {
        messageId: message._id,
        reactions: message.reactions,
      };

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReaction", emitData);
      }

      return res.status(200).json(emitData);
    } catch (error) {
      console.error("Error adding reaction:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  getReactions: async (req, res) => {
    try {
      const { messageId } = req.params;

      const message = await Message.findById(messageId).populate(
        "reactions.users",
        "fullName profilePic"
      );

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      return res.status(200).json({ reactions: message.reactions });
    } catch (error) {
      console.error("Error getting reactions:", error);
      return res.status(500).json({ error: error.message });
    }
  },
};

export default reactionController;
