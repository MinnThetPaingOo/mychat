import aj from "../lib/arject.js";

const arjectMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ message: "Too many requests" });
      }
      if (decision.reason.isBot && decision.reason.isBot()) {
        return res
          .status(403)
          .json({ message: "Bot request blocked by Arcjet" });
      }
      return res.status(403).json({ message: "Request denied" });
    }

    next();
  } catch (error) {
    console.error("Arcjet middleware error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error in Arcjet middleware" });
  }
};

export default arjectMiddleware;
