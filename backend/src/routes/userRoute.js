import express from "express";
const router = express.Router();
import userController from "../controllers/userController.js";
import ProtectRoute from "../middlewares/protectRoute.js";

router.put(
  "/updateProfilePicture",
  ProtectRoute,
  userController.updateProfilePicture,
);

router.put("/changePassword", ProtectRoute, userController.changePassword);
export default router;
