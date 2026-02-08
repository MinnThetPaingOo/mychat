import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useMyDayStore = create((set, get) => ({
  contactsStories: [],
  userStories: [],
  selectedStory: null,
  isLoadingStories: false,
  isCreating: false,
  isViewing: false,

  subscribeToStories: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    // Listen for new stories from contacts
    socket.on("new_story_created", ({ user, story }) => {
      const currentStories = get().contactsStories;
      const userIndex = currentStories.findIndex(
        (item) => item.user._id === user._id,
      );

      if (userIndex !== -1) {
        // Add story to existing user
        currentStories[userIndex].stories.unshift(story);
      } else {
        // Add new user with story
        currentStories.unshift({ user, stories: [story] });
      }

      set({ contactsStories: [...currentStories] });
      toast.success(`${user.fullName} added a new story`);
    });

    // Listen for deleted stories
    socket.on("story_deleted", ({ storyId, userId }) => {
      const currentStories = get().contactsStories;
      const updatedStories = currentStories
        .map((item) => ({
          ...item,
          stories: item.stories.filter((s) => s._id !== storyId),
        }))
        .filter((item) => item.stories.length > 0);

      set({ contactsStories: updatedStories });
    });

    // Listen for story views (for your own stories)
    socket.on("story_viewed", ({ storyId, viewer, viewedAt }) => {
      const currentStories = get().contactsStories;
      const userStories = get().userStories;

      // Update in contactsStories
      const updatedContactsStories = currentStories.map((item) => ({
        ...item,
        stories: item.stories.map((story) => {
          if (story._id === storyId) {
            const views = story.views || [];
            return {
              ...story,
              views: [...views, { userId: viewer._id, user: viewer, viewedAt }],
            };
          }
          return story;
        }),
      }));

      // Update in userStories
      const updatedUserStories = userStories.map((story) => {
        if (story._id === storyId) {
          const views = story.views || [];
          return {
            ...story,
            views: [...views, { userId: viewer._id, user: viewer, viewedAt }],
          };
        }
        return story;
      });

      set({
        contactsStories: updatedContactsStories,
        userStories: updatedUserStories,
      });
    });
  },

  unsubscribeFromStories: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("new_story_created");
    socket.off("story_deleted");
    socket.off("story_viewed");
  },

  fetchContactsStories: async () => {
    set({ isLoadingStories: true });
    try {
      const res = await axiosInstance.get("/myday");
      set({ contactsStories: res.data, isLoadingStories: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load stories");
      set({ isLoadingStories: false });
    }
  },

  fetchUserStories: async (userId) => {
    set({ isViewing: true });
    try {
      const res = await axiosInstance.get(`/myday/user/${userId}`);
      set({ userStories: res.data, isViewing: false });
    } catch (error) {
      toast.error("Failed to load user stories");
      set({ isViewing: false });
    }
  },

  createStory: async (storyData) => {
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/myday", storyData);

      const currentStories = get().contactsStories;
      const myStoriesIndex = currentStories.findIndex(
        (item) => item.user._id === res.data.userId,
      );

      if (myStoriesIndex !== -1) {
        currentStories[myStoriesIndex].stories.unshift(res.data);
      } else {
        currentStories.unshift({
          user: {
            _id: res.data.userId,
            fullName: res.data.fullName,
            userName: res.data.userName,
            profilePicture: res.data.profilePicture,
          },
          stories: [res.data],
        });
      }

      set({ contactsStories: [...currentStories], isCreating: false });
      toast.success("Story created!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create story");
      set({ isCreating: false });
      throw error;
    }
  },

  markAsViewed: async (myDayId) => {
    try {
      await axiosInstance.post(`/myday/${myDayId}/view`);
    } catch (error) {
      console.error("Failed to mark as viewed:", error);
    }
  },

  deleteStory: async (myDayId) => {
    try {
      await axiosInstance.delete(`/myday/${myDayId}`);

      const currentStories = get().contactsStories;
      const updatedStories = currentStories
        .map((item) => ({
          ...item,
          stories: item.stories.filter((s) => s._id !== myDayId),
        }))
        .filter((item) => item.stories.length > 0);

      set({ contactsStories: updatedStories });
      toast.success("Story deleted");
    } catch (error) {
      toast.error("Failed to delete story");
    }
  },

  clearStories: () => {
    set({
      contactsStories: [],
      userStories: [],
      selectedStory: null,
    });
  },
}));
