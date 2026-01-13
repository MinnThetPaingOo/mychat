import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import reactionController from "../controllers/reactionController.js";

const router = express.Router();

router.post("/:messageId", protectRoute, reactionController.addReaction);
router.get("/:messageId", protectRoute, reactionController.getReactions);

export default router;
