import express from "express";
import { body } from "express-validator";
const router = express.Router();
import handleErrorMessage from "../middlewares/handleErrorMessage.js";
import authController from "../controllers/authController.js";

router.post(
  "/signup",
  body("fullName").notEmpty(),
  body("email").notEmpty(),
  body("password").notEmpty(),
  handleErrorMessage,
  authController.signup
);

router.post("/login", (req, res) => {
  res.json({ message: "Login route", success: true });
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logout route", success: true });
});

export default router;
