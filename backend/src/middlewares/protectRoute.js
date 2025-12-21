import User from "../models/User.js";
import jwt from "jsonwebtoken";

const ProtectRoute = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    if (!token) {
      return res.status(400).json({ message: "token need to provide" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(400).json({ message: "invalid token" });
    }
    let user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ msg: "internal server error" });
  }
};

export default ProtectRoute;
