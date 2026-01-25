import claudinary from "../lib/claudinary.js";
import UserModel from "../models/User.js";
import bcrypt from "bcryptjs";
const userController = {
  updateProfilePicture: async (req, res) => {
    try {
      const { profilePicture } = req.body;
      if (!profilePicture) {
        throw new Error("Profile picture URL is required");
      }
      const userId = req.user._id;
      const uploadResponse = await claudinary.uploader.upload(profilePicture);
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { profilePicture: uploadResponse.secure_url },
        { new: true },
      ).select("_id fullName userName email profilePicture isOnline bio");
      return res
        .status(200)
        .json({ message: "Profile picture updated", user: updatedUser });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new Error("Both current and new passwords are required");
      }
      const userId = req.user._id;
      const user = await UserModel.findById(userId);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new Error("Current password is incorrect");
      }
      //password validation
      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
      }
      //need to hash the new password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      await user.save();
      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  checkUserNameAvailable: async (req, res) => {
    try {
      const loginUserName = req.user.userName;
      const { userName } = req.params;
      const searchUser = await UserModel.findOne({ userName });

      if (!searchUser) {
        return res.status(200).json({ available: true, message: "Available" });
      }

      if (searchUser.userName === loginUserName) {
        return res
          .status(200)
          .json({ available: true, message: "Your current username" });
      }

      // Username is taken by another user
      return res.status(200).json({ available: false, message: "Unavailable" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  updateInfo: async (req, res) => {
    try {
      const userId = req.user._id;
      const { fullName, userName, bio, isAvailableUserName } = req.body;
      if (!fullName) {
        throw new Error("Full name is required");
      }
      if (!userName) {
        throw new Error("Username is required");
      }
      if (!isAvailableUserName) {
        throw new Error("Username is not available");
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { fullName, userName, bio },
        { new: true },
      ).select("_id fullName userName profilePicture bio");
      return res
        .status(200)
        .json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
export default userController;
