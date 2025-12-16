import express from "express";
const router = express.Router();

router.post("/send", (req, res) => {
  res.send("Send Message Route");
});
router.get("/receive", (req, res) => {
  res.send("Receive Message Route123");
});

export default router;
