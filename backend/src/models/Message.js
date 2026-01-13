import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["image", "video", "file"],
          required: true,
        },
        name: String,
        size: Number,
      },
    ],
    reactions: [
      {
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
          required: true,
        },
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: Date,
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
