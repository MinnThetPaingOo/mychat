import express from "express";
import { body } from "express-validator";
const router = express.Router();
import handleErrorMessage from "../middlewares/handleErrorMessage.js";
import authController from "../controllers/authController.js";
import ProtectRoute from "../middlewares/protectRoute.js";

router.post(
  "/signup",
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleErrorMessage,
  authController.signup,
);

router.post(
  "/login",
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleErrorMessage,
  authController.login,
);

router.post("/logout", ProtectRoute, authController.logout);

router.get("/checkAuth", ProtectRoute, authController.checkAuth);

export default router;
