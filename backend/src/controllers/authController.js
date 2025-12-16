import UserModel from "../models/User.js";
import bcrypt from "bcryptjs";
import createToken from "../lib/createToken.js";
const AuthController = {
  signup: async (req, res) => {
    try {
      const { fullName, email, password } = req.body;

      //email validation
      var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!email.match(mailformat)) {
        throw new Error("Invalid email format");
      }
      let emailExits = await UserModel.findOne({ email });
      if (emailExits) {
        throw new Error("Email already exists");
      }

      //password validation
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      //hash password
      let salt = await bcrypt.genSalt();
      let hashValue = await bcrypt.hash(password, salt);

      //create new user
      const newUser = await UserModel.create({
        fullName,
        email,
        password: hashValue,
      });
      await newUser.save();

      //generate token & send response
      let token = createToken(newUser._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000, //3 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      //exclude password from response
      const user = await UserModel.findById(newUser._id).select("-password");
      return res.status(200).json({ newUser: user, token });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
export default AuthController;
