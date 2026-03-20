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

      // Optimized: Use aggregation pipeline to find users NOT chatted with (single query)
      const suggestedContacts = await User.aggregate([
        // Start with all users except self
        { $match: { _id: { $ne: userId } } },
        // Lookup messages to check if we've chatted
        {
          $lookup: {
            from: "messages",
            let: { contactId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$senderId", userId] },
                          { $eq: ["$receiverId", "$$contactId"] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$senderId", "$$contactId"] },
                          { $eq: ["$receiverId", userId] },
                        ],
                      },
                    ],
                  },
                },
              },
              { $limit: 1 }, // Just need to know if at least 1 message exists
            ],
            as: "chatHistory",
          },
        },
        // Only keep users with NO chat history
        { $match: { chatHistory: { $size: 0 } } },
        // Sort by creation date and limit to 5
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        // Remove sensitive data
        { $project: { password: 0 } },
      ]);

      return res.status(200).json({ contacts: suggestedContacts });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};

export default contactController;
