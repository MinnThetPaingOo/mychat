import UserModel from "../models/User.js";
import bcrypt from "bcryptjs";
import createToken from "../lib/createToken.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import Message from "../models/Message.js";

const AuthController = {
  signup: async (req, res) => {
    try {
      const { fullName, email, password } = req.body;
      const errors = {};
      //full name validation, remove extra spaces
      const trimmedFullName = fullName
        ? fullName.trim().replace(/\s+/g, " ")
        : "";

      // Email validation
      var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!email || !email.match(mailformat)) {
        errors.email = "Invalid email format";
      } else {
        let emailExits = await UserModel.findOne({ email });
        if (emailExits) {
          errors.email = "Email already exists";
        }
      }

      //auto create username from full name + random numbers
      const userNameBase = fullName.replace(/\s+/g, "").toLowerCase();
      let userName = userNameBase;
      let suffix = 1;
      while (await UserModel.findOne({ userName })) {
        userName = `${userNameBase}${suffix}`;
        suffix++;
      }

      // Password validation
      if (!password || password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }

      // Full name validation
      if (!fullName || fullName.trim() === "") {
        errors.fullName = "Full name is required";
      }

      // If there are errors, return them
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      // Hash password
      let salt = await bcrypt.genSalt();
      let hashValue = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = await UserModel.create({
        fullName: trimmedFullName,
        email,
        userName,
        password: hashValue,
      });
      await newUser.save();

      // Generate token & send cookie
      let token = createToken(newUser._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000, //3 days
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      // Exclude password from response
      const user = await UserModel.findById(newUser._id).select("-password");

      // Send welcome email
      try {
        const clientURL = process.env.CLIENT_URL;
        await sendWelcomeEmail(user.email, user.fullName, clientURL);
        console.log("Welcome email sent successfully");
      } catch (emailError) {
        console.log("Error sending welcome email:", emailError.message);
      }

      return res.status(201).json({ user, token });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      let { email, password } = req.body;
      const errors = {};

      // Find user by email
      let user = await UserModel.findOne({ email });
      if (!user) {
        errors.email = "Invalid credentials";
      } else {
        // Compare password
        let isCorrect = await bcrypt.compare(password, user.password);
        if (!isCorrect) {
          errors.email = "Invalid credentials";
        }
      }

      // If there are errors, return them
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      // Create token & send cookie
      let token = createToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      // Exclude password from response
      user = await UserModel.findById(user._id).select("-password");
      return res.status(200).json({ user, token });
    } catch (error) {
      return res.status(400).json({ errors: { general: error.message } });
    }
  },

  logout: (req, res) => {
    try {
      res.cookie("jwt", "", {
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.log("Error in logout controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  checkAuth: (req, res) => {
    try {
      res.status(200).json(req.user);
    } catch (error) {
      console.log("Error in checkAuth controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Combined endpoint for initial app load: returns user + chatted contacts in single request
  initializeApp: async (req, res) => {
    try {
      const userId = req.user._id;

      // ✅ OPTIMIZATION: Only scan recent messages (last 30 days) to speed up aggregation
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Fetch chatted contacts with last message and unread count using aggregation
      const chattedContacts = await Message.aggregate([
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }],
            createdAt: { $gte: thirtyDaysAgo }, // ✅ NEW: Filter old messages
          },
        },
        {
          $sort: { createdAt: -1 },
        },
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
        {
          $group: {
            _id: "$otherUserId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: { $cond: ["$isUnread", 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
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
        {
          $sort: { "lastMessage.createdAt": -1 },
        },
      ]);

      // Return both user and chatted contacts
      res.status(200).json({
        user: req.user,
        chats: chattedContacts,
      });
    } catch (error) {
      console.log("Error in initializeApp controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
export default AuthController;
