import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
const useUserStore = create((set) => ({
  userProfile: null,
  isLoadingProfilePage: false,
  profileError: null,
  isUpdatingPP: false,
  isUpdatingPassword: false,

  //check username availability
  isAvailableUserName: false,
  userNameSearchResult: "",
  isCheckingUserName: false,

  //edit profile functions
  isSavingProfileInfo: false,
  isEditingInfo: false,

  setShowMenu: (showMenu) => set({ showMenu }),
  setIsEditingInfo: (isEditingInfo) => set({ isEditingInfo }),

  fetchUserProfile: async (userName) => {
    set({ isLoadingProfilePage: true, profileError: null });
    try {
      const res = await axiosInstance.get(`/profile/${userName}`);
      const userProfile = res.data.user;
      set({ userProfile, isLoadingProfilePage: false });
    } catch (error) {
      set({
        profileError: error.message,
        isLoadingProfilePage: false,
        userProfile: null,
      });
      console.error("Error fetching user profile:", error);
    }
  },

  clearUserProfile: () => set({ userProfile: null, profileError: null }),

  updateProfile: async (data) => {
    try {
      set({ isUpdatingPP: true });
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
        isUpdatingPP: false,
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
      set({ isUpdatingPP: false });
    }
  },

  checkUserNameAvailable: async (userName) => {
    try {
      set({ isCheckingUserName: true });
      const response = await axiosInstance.get(
        `/user/checkUserNameAvailable/${userName}`,
      );
      set({
        isAvailableUserName: response.data.available,
        userNameSearchResult: response.data.message,
        isCheckingUserName: false,
      });
      return response.data.available;
    } catch (error) {
      console.log("Error checking username availability:", error);
      return false;
    }
  },

  updateInfo: async (data) => {
    try {
      set({ isSavingProfileInfo: true });
      const response = await axiosInstance.put(`/user/updateInfo`, data);
      toast.success("User info updated successfully");

      //update full name, username, bio in useAuthStore
      useAuthStore.setState((state) => ({
        authUser: {
          ...state.authUser,
          fullName: response.data.user.fullName,
          userName: response.data.user.userName,
          bio: response.data.user.bio,
        },
      }));
      set({ isSavingProfileInfo: false });
      // Return the new username to be used for navigation in the component
      return response.data.user.userName;
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating user info");
      set({ isSavingProfileInfo: false });
      return null; // Return null on failure
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    set({ isUpdatingPassword: true });
    try {
      const res = await axiosInstance.put("/auth/update-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
      return false;
    } finally {
      set({ isUpdatingPassword: false });
    }
  },
}));

export default useUserStore;
