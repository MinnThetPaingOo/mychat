import MessageReaction from "../models/MessageReaction.js";

// Add or update a reaction
export const addOrUpdateReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user._id;

    // Remove previous reaction by this user for this message (if any)
    await MessageReaction.findOneAndDelete({ messageId, userId });

    // Add new reaction
    const reaction = await MessageReaction.create({ messageId, userId, emoji });
    res.status(201).json(reaction);
  } catch (err) {
    res.status(500).json({ error: "Failed to add reaction" });
  }
};

// Remove a reaction
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.user._id;
    await MessageReaction.findOneAndDelete({ messageId, userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove reaction" });
  }
};

// Get all reactions for a message
export const getReactionsForMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const reactions = await MessageReaction.find({ messageId });
    res.json(reactions);
  } catch (err) {
    res.status(500).json({ error: "Failed to get reactions" });
  }
};
