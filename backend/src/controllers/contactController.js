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

      // Use aggregation pipeline to fetch chatted contacts with last message and unread count in ONE query
      const contactsWithDetails = await Message.aggregate([
        // Step 1: Match messages where user is either sender or receiver
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }],
          },
        },
        // Step 2: Sort by creation time (most recent first)
        {
          $sort: { createdAt: -1 },
        },
        // Step 3: For each message, determine the "other" user (sender or receiver)
        {
          $addFields: {
            otherUserId: {
              $cond: [
                { $eq: ["$senderId", userId] },
                "$receiverId",
                "$senderId",
              ],
            },
            isUnread: {
              $and: [
                { $eq: ["$receiverId", userId] },
                { $ne: ["$status", "seen"] },
              ],
            },
          },
        },
        // Step 4: Group by otherUserId to get last message and unread count
        {
          $group: {
            _id: "$otherUserId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: { $cond: ["$isUnread", 1, 0] },
            },
          },
        },
        // Step 5: Lookup user details
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        // Step 6: Unwind user details array
        {
          $unwind: "$userDetails",
        },
        // Step 7: Project the final shape
        {
          $project: {
            _id: "$userDetails._id",
            fullName: "$userDetails.fullName",
            email: "$userDetails.email",
            userName: "$userDetails.userName",
            profilePicture: "$userDetails.profilePicture",
            isOnline: "$userDetails.isOnline",
            bio: "$userDetails.bio",
            lastSeen: "$userDetails.lastSeen",
            contacts: "$userDetails.contacts",
            createdAt: "$userDetails.createdAt",
            updatedAt: "$userDetails.updatedAt",
            lastMessage: {
              _id: "$lastMessage._id",
              text: "$lastMessage.text",
              attachments: "$lastMessage.attachments",
              senderId: "$lastMessage.senderId",
              createdAt: "$lastMessage.createdAt",
            },
            unreadCount: "$unreadCount",
          },
        },
        // Step 8: Sort by last message time (most recent first)
        {
          $sort: { "lastMessage.createdAt": -1 },
        },
      ]);

      return res.status(200).json({ chattedContacts: contactsWithDetails });
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
