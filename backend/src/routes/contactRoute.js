import express from "express";
import contactController from "../controllers/contactController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/getAllContacts", protectRoute, contactController.getAllContacts);
router.get("/chattedContacts", protectRoute, contactController.chattedContacts);

export default router;
