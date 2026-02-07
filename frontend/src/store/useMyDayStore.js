import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useMyDayStore = create((set, get) => ({
  contactsStories: [],
  userStories: [],
  selectedStory: null,
  isLoadingStories: false,
  isCreating: false,
  isViewing: false,

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
