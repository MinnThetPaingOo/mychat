import claudinary from "../lib/claudinary.js";
import UserModel from "../models/User.js";
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
        { new: true }
      ).select("-password");
      return res
        .status(200)
        .json({ message: "Profile picture updated successfully" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
export default userController;
