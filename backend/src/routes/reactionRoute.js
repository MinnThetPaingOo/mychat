import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  addOrUpdateReaction,
  removeReaction,
  getReactionsForMessage,
} from "../controllers/reactionController.js";

const router = express.Router();

router.post("/", protectRoute, addOrUpdateReaction);
router.delete("/", protectRoute, removeReaction);
router.get("/:messageId", protectRoute, getReactionsForMessage);

export default router;
