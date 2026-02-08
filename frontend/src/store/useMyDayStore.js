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

  _storyCreatedHandler: null,
  _storyDeletedHandler: null,
  _storyViewedHandler: null,

  subscribeToStories: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    // Remove previous handlers if any
    const prev = get();
    if (prev._storyCreatedHandler)
      socket.off("new_story_created", prev._storyCreatedHandler);
    if (prev._storyDeletedHandler)
      socket.off("story_deleted", prev._storyDeletedHandler);
    if (prev._storyViewedHandler)
      socket.off("story_viewed", prev._storyViewedHandler);

    // Listen for new stories from contacts
    const onStoryCreated = ({ user, story }) => {
      const currentStories = get().contactsStories;
      const userIndex = currentStories.findIndex(
        (item) => item.user._id === user._id,
      );

      let updatedStories;
      if (userIndex !== -1) {
        updatedStories = currentStories.map((item, i) =>
          i === userIndex
            ? { ...item, stories: [story, ...item.stories] }
            : item,
        );
      } else {
        updatedStories = [{ user, stories: [story] }, ...currentStories];
      }

      set({ contactsStories: updatedStories });
    };

    // Listen for deleted stories
    const onStoryDeleted = ({ storyId }) => {
      const currentStories = get().contactsStories;
      const updatedStories = currentStories
        .map((item) => ({
          ...item,
          stories: item.stories.filter((s) => s._id !== storyId),
        }))
        .filter((item) => item.stories.length > 0);

      set({ contactsStories: updatedStories });
    };

    // Listen for story views (for your own stories)
    const onStoryViewed = ({ storyId, viewer, viewedAt }) => {
      const currentStories = get().contactsStories;
      const userStories = get().userStories;

      // Update in contactsStories
      const updatedContactsStories = currentStories.map((item) => ({
        ...item,
        stories: item.stories.map((story) => {
          if (story._id === storyId) {
            const views = story.views || [];
            // Prevent duplicate
            if (views.some((v) => v.userId === viewer._id)) return story;
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
          if (views.some((v) => v.userId === viewer._id)) return story;
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
    };

    set({
      _storyCreatedHandler: onStoryCreated,
      _storyDeletedHandler: onStoryDeleted,
      _storyViewedHandler: onStoryViewed,
    });

    socket.on("new_story_created", onStoryCreated);
    socket.on("story_deleted", onStoryDeleted);
    socket.on("story_viewed", onStoryViewed);
  },

  unsubscribeFromStories: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    const { _storyCreatedHandler, _storyDeletedHandler, _storyViewedHandler } =
      get();
    if (_storyCreatedHandler)
      socket.off("new_story_created", _storyCreatedHandler);
    if (_storyDeletedHandler) socket.off("story_deleted", _storyDeletedHandler);
    if (_storyViewedHandler) socket.off("story_viewed", _storyViewedHandler);

    set({
      _storyCreatedHandler: null,
      _storyDeletedHandler: null,
      _storyViewedHandler: null,
    });
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
      const { authUser } = useAuthStore.getState();
      await axiosInstance.post(`/myday/${myDayId}/view`);

      // Update the seen state locally in contactsStories so the ring updates
      const currentStories = get().contactsStories;
      const updatedStories = currentStories.map((item) => ({
        ...item,
        stories: item.stories.map((story) => {
          if (story._id === myDayId) {
            const views = story.views || [];
            if (views.some((v) => v.userId === authUser._id)) return story;
            return {
              ...story,
              views: [...views, { userId: authUser._id, viewedAt: new Date() }],
            };
          }
          return story;
        }),
      }));
      set({ contactsStories: updatedStories });
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
