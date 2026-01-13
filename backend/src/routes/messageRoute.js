import express from "express";
import messageController from "../controllers/messageController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/send/:id", protectRoute, messageController.sendMessage);
router.get("/receive/:id", protectRoute, messageController.receiveMessage);
router.get("/conversations/:id", protectRoute, messageController.conversations);
router.get(
  "/lastConversationsWith/:id",
  protectRoute,
  messageController.getLastMessage
);

export default router;
