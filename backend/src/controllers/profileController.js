import UserModel from "../models/User.js";
const profileController = {
  getUserProfile: async (req, res) => {
    try {
      const { userName } = req.params;
      // get id, fullName, userName, email, profilePicture
      const user = await UserModel.findOne({ userName }).select(
        "_id fullName userName email profilePicture",
      );
      if (!user) {
        throw new Error("User not found");
      }
      return res.status(200).json({ user });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
export default profileController;
