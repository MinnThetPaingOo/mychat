import mongoose from "mongoose";

const messageReactionSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reaction: {
      type: String,
      enum: ["like", "love", "laugh", "sad", "angry", "wow"],
      required: true,
    },
  },
  { timestamps: true }
);

const MessageReaction = mongoose.model(
  "MessageReaction",
  messageReactionSchema
);

export default MessageReaction;
