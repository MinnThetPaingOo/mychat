import User from "../models/User.js";
import Message from "../models/Message.js";

const contactController = {
  getAllContacts: async (req, res) => {
    try {
      const loginUserId = req.user._id;
      const getAllContacts = await User.find({
        _id: { $ne: loginUserId },
      }).select("-password");
      return res.status(200).json({ contacts: getAllContacts });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  chattedContacts: async (req, res) => {
    try {
      const userId = req.user._id;
      // find users who have chatted with the logged-in user
      // by checking messages where they are either sender or receiver
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      });

      // extract unique user IDs from these messages
      const chattedUserIds = new Set();
      messages.forEach((msg) => {
        if (msg.senderId.toString() !== userId.toString()) {
          chattedUserIds.add(msg.senderId.toString());
        }
        if (msg.receiverId.toString() !== userId.toString()) {
          chattedUserIds.add(msg.receiverId.toString());
        }
      });

      // fetch user details for these IDs
      const chattedContacts = await User.find({
        _id: { $in: Array.from(chattedUserIds) },
      }).select("-password");
      return res.status(200).json({ chattedContacts: chattedContacts });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
  suggestedContacts: async (req, res) => {
    try {
      const userId = req.user._id;

      // Get users the logged-in user has already chatted with
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      });

      const chattedUserIds = new Set();
      messages.forEach((msg) => {
        if (msg.senderId.toString() !== userId.toString()) {
          chattedUserIds.add(msg.senderId.toString());
        }
        if (msg.receiverId.toString() !== userId.toString()) {
          chattedUserIds.add(msg.receiverId.toString());
        }
      });

      // Fetch the last 5 users excluding logged-in user and already chatted users
      const suggestedContacts = await User.find({
        _id: {
          $ne: userId,
          $nin: Array.from(chattedUserIds),
        },
      })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({ contacts: suggestedContacts });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};

export default contactController;
