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
      ).select("-password");
      return res
        .status(200)
        .json({ message: "Profile picture updated successfully" });
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
};
export default userController;
