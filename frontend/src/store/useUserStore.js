import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

const useUserStore = create((set) => ({
  userProfile: null,
  isLoadingProfile: false,
  profileError: null,
  isUpdatingProfile: false,

  fetchUserProfile: async (userName) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const res = await axiosInstance.get(`/profile/${userName}`);
      const userProfile = res.data.user;
      set({ userProfile, isLoadingProfile: false });
    } catch (error) {
      set({
        profileError: error.message,
        isLoadingProfile: false,
        userProfile: null,
      });
      console.error("Error fetching user profile:", error);
    }
  },

  clearUserProfile: () => set({ userProfile: null, profileError: null }),

  updateProfile: async (data) => {
    try {
      set({ isUpdatingProfile: true });
      const response = await axiosInstance.put(
        "/user/updateProfilePicture",
        data,
      );
      //update only profile picture in userProfile
      set((state) => ({
        userProfile: {
          ...state.userProfile,
          profilePicture: response.data.user.profilePicture,
        },
        isUpdatingProfile: false,
      }));
      //update only profile picture in authStore
      useAuthStore.setState((state) => ({
        authUser: {
          ...state.authUser,
          profilePicture: response.data.user.profilePicture,
        },
      }));
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response.data.message);
      set({ isUpdatingProfile: false });
    }
  },
}));

export default useUserStore;
