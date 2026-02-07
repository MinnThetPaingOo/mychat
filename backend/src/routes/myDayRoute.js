import express from "express";
import ProtectRoute from "../middlewares/protectRoute.js";
import {
  createMyDay,
  getContactsMyDay,
  getUserMyDay,
  viewMyDay,
  deleteMyDay,
} from "../controllers/myDayController.js";

const router = express.Router();

router.post("/", ProtectRoute, createMyDay);
router.get("/", ProtectRoute, getContactsMyDay);
router.get("/user/:userId", ProtectRoute, getUserMyDay);
router.post("/:myDayId/view", ProtectRoute, viewMyDay);
router.delete("/:myDayId", ProtectRoute, deleteMyDay);

export default router;
