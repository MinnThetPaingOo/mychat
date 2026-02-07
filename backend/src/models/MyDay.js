import mongoose from "mongoose";

const myDaySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      maxlength: 200,
    },
    backgroundColor: {
      type: String,
      default: "#4F46E5",
    },
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  { timestamps: true },
);

// TTL index for auto-deletion after expiration
myDaySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MyDay = mongoose.model("MyDay", myDaySchema);

export default MyDay;
