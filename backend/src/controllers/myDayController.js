import MyDay from "../models/MyDay.js";
import User from "../models/User.js";
import claudinary from "../lib/claudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Create a new MyDay post
export const createMyDay = async (req, res) => {
  try {
    const { caption, backgroundColor, media } = req.body;
    const userId = req.user._id;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const myDayData = {
      userId,
      fullName: user.fullName,
      userName: user.userName || user.fullName,
      profilePicture: user.profilePicture,
      caption: caption || "",
      backgroundColor: backgroundColor || "#4F46E5",
    };

    // Handle media upload if present
    if (media && media.data && media.type) {
      const { data, type } = media;

      if (type === "image") {
        const uploadResponse = await claudinary.uploader.upload(data, {
          resource_type: "image",
          folder: "myday/images",
        });
        myDayData.mediaType = "image";
        myDayData.mediaUrl = uploadResponse.secure_url;
      } else if (type === "video") {
        const uploadResponse = await claudinary.uploader.upload(data, {
          resource_type: "video",
          folder: "myday/videos",
        });
        myDayData.mediaType = "video";
        myDayData.mediaUrl = uploadResponse.secure_url;
      }
    }

    const myDay = await MyDay.create(myDayData);

    // Emit socket event to notify all online users about new story
    try {
      // Broadcast to all connected users except the creator
      const creatorSocketId = getReceiverSocketId(userId.toString());
      if (creatorSocketId) {
        io.except(creatorSocketId).emit("new_story_created", {
          user: {
            _id: myDay.userId,
            fullName: myDay.fullName,
            userName: myDay.userName,
            profilePicture: myDay.profilePicture,
          },
          story: myDay,
        });
      } else {
        io.emit("new_story_created", {
          user: {
            _id: myDay.userId,
            fullName: myDay.fullName,
            userName: myDay.userName,
            profilePicture: myDay.profilePicture,
          },
          story: myDay,
        });
      }
    } catch (socketError) {
      console.error("Error emitting socket event:", socketError);
    }

    res.status(201).json(myDay);
  } catch (error) {
    console.error("Error in createMyDay:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all active MyDay posts from contacts
export const getContactsMyDay = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's contacts
    const user = await User.findById(userId).select("contacts");
    const contactIds = user.contacts || [];

    // If no contacts, show all users' stories (for better UX)
    let userIdsToShow = [...contactIds, userId];

    // If user has no contacts, get stories from all users to show something
    if (contactIds.length === 0) {
      const allUsers = await User.find({ _id: { $ne: userId } })
        .select("_id")
        .limit(50);
      userIdsToShow = [...allUsers.map((u) => u._id), userId];
    }

    // Get all active stories from contacts + own stories
    const allStories = await MyDay.find({
      userId: { $in: userIdsToShow },
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = allStories.reduce((acc, story) => {
      const userIdStr = story.userId.toString();
      if (!acc[userIdStr]) {
        acc[userIdStr] = {
          user: {
            _id: story.userId,
            fullName: story.fullName,
            userName: story.userName,
            profilePicture: story.profilePicture,
          },
          stories: [],
        };
      }
      acc[userIdStr].stories.push(story);
      return acc;
    }, {});

    const result = Object.values(groupedStories);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getContactsMyDay:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get specific user's MyDay posts
export const getUserMyDay = async (req, res) => {
  try {
    const { userId } = req.params;

    const stories = await MyDay.find({
      userId,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: 1 }); // Oldest first

    // Populate viewer information
    const storiesWithViewers = await Promise.all(
      stories.map(async (story) => {
        const storyObj = story.toObject();
        if (storyObj.views && storyObj.views.length > 0) {
          const viewsWithUserInfo = await Promise.all(
            storyObj.views.map(async (view) => {
              const viewer = await User.findById(view.userId).select(
                "fullName userName profilePicture",
              );
              return {
                ...view,
                user: viewer,
              };
            }),
          );
          storyObj.views = viewsWithUserInfo;
        }
        return storyObj;
      }),
    );

    res.status(200).json(storiesWithViewers);
  } catch (error) {
    console.error("Error in getUserMyDay:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark MyDay as viewed
export const viewMyDay = async (req, res) => {
  try {
    const { myDayId } = req.params;
    const viewerId = req.user._id;

    const myDay = await MyDay.findById(myDayId);
    if (!myDay) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Check if already viewed
    const alreadyViewed = myDay.views.some(
      (view) => view.userId.toString() === viewerId.toString(),
    );

    if (!alreadyViewed) {
      myDay.views.push({ userId: viewerId, viewedAt: new Date() });
      await myDay.save();

      // Emit socket event to notify story owner about new view
      if (myDay.userId.toString() !== viewerId.toString()) {
        const ownerSocketId = getReceiverSocketId(myDay.userId.toString());
        if (ownerSocketId) {
          const viewer = await User.findById(viewerId).select(
            "fullName userName profilePicture",
          );
          io.to(ownerSocketId).emit("story_viewed", {
            storyId: myDay._id,
            viewer: {
              _id: viewerId,
              fullName: viewer?.fullName,
              userName: viewer?.userName,
              profilePicture: viewer?.profilePicture,
            },
            viewedAt: new Date(),
          });
        }
      }
    }

    res.status(200).json({ message: "Story viewed" });
  } catch (error) {
    console.error("Error in viewMyDay:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete MyDay
export const deleteMyDay = async (req, res) => {
  try {
    const { myDayId } = req.params;
    const userId = req.user._id;

    const myDay = await MyDay.findOneAndDelete({
      _id: myDayId,
      userId,
    });

    if (!myDay) {
      return res
        .status(404)
        .json({ message: "Story not found or unauthorized" });
    }

    // Emit socket event to notify all online users about deleted story
    try {
      const creatorSocketId = getReceiverSocketId(userId.toString());
      if (creatorSocketId) {
        io.except(creatorSocketId).emit("story_deleted", {
          storyId: myDay._id,
          userId: myDay.userId,
        });
      } else {
        io.emit("story_deleted", {
          storyId: myDay._id,
          userId: myDay.userId,
        });
      }
    } catch (socketError) {
      console.error("Error emitting socket event:", socketError);
    }

    // Delete from cloudinary if media exists
    if (myDay.mediaUrl) {
      try {
        const publicId = myDay.mediaUrl
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await claudinary.uploader.destroy(publicId, {
          resource_type: myDay.mediaType === "video" ? "video" : "image",
        });
      } catch (error) {
        console.error("Error deleting media from cloudinary:", error);
      }
    }

    await myDay.deleteOne();
    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMyDay:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
