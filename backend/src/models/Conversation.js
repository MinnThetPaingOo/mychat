import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const ConversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
    },
    groupName: {
      type: String,
      required: function () {
        return this.type === "group";
      },
      trim: true,
    },
    groupAvatar: {
      type: String,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    admins: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Conversation", ConversationSchema);
