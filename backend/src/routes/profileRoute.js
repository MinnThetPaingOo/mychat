import express from "express";
const router = express.Router();
import profileController from "../controllers/profileController.js";
import ProtectRoute from "../middlewares/protectRoute.js";

router.get("/:userName", ProtectRoute, profileController.getUserProfile);
export default router;
