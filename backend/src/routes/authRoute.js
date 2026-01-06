import express from "express";
import { body } from "express-validator";
const router = express.Router();
import handleErrorMessage from "../middlewares/handleErrorMessage.js";
import authController from "../controllers/authController.js";
import ProtectRoute from "../middlewares/protectRoute.js";
import arjectMiddleware from "../middlewares/arjectMiddleware.js";

router.post(
  "/signup",
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleErrorMessage,
  authController.signup
);

router.post(
  "/login",
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleErrorMessage,
  authController.login
);

router.post("/logout", ProtectRoute, authController.logout);

router.get("/checkAuth", ProtectRoute, authController.checkAuth);

router.get("/arjectTest", (req, res) => {
  res.status(200).json({ message: "Arcjet middleware passed!" });
});

// Export the router
export default router;
