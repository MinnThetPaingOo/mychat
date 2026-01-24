import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  Pencil,
  User,
  Check,
  X,
  Loader,
} from "lucide-react";
import useUserStore from "../store/useUserStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useParams } from "react-router-dom";
import BorderAnimatedContainer from "../components/borderAnimatedContainer";
import { useChatStore } from "../store/useChatStore";
import UploadingOverlay from "../components/UploadingOverlay";

const ProfilePage = () => {
  const { userProfile, isLoadingProfile, updateProfile, isUpdatingProfile } =
    useUserStore();
  const { authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();
  const navigate = useNavigate();
  const { userName } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    bio: "",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    useUserStore.getState().fetchUserProfile(userName);
    return () => {
      useUserStore.getState().clearUserProfile();
    };
  }, [userName]);

  // Update formData when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || "",
        userName: userProfile.userName || "",
        bio: userProfile.bio || "",
      });
    }
  }, [userProfile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePicture: base64Image });
    };
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log("Saving data:", formData);
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleSendMessage = () => {
    if (userProfile) {
      setSelectedUser(userProfile);
      navigate("/chat");
    }
  };

  // Show loading state while fetching data (after all hooks are defined)
  if (isLoadingProfile || !userProfile) {
    return (
      <div className="w-full h-full relative max-w-6xl">
        <BorderAnimatedContainer>
          <div className="w-full h-full text-white bg-gray-900 flex items-center justify-center"></div>
        </BorderAnimatedContainer>
      </div>
    );
  }

  const isOwnProfile = authUser && userProfile._id === authUser._id;

  return (
    <div className="w-full h-full relative max-w-6xl">
      <BorderAnimatedContainer>
        <div className="w-full h-full text-white bg-gray-900 p-4 md:p-8 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <Pencil size={20} />
                </button>
              ) : (
                <div className="w-8 h-8" />
              )}
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img
                  src={userProfile.profilePicture || "/avatar.png"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                />

                {/* Beautiful loading overlay for profile picture */}
                {isUpdatingProfile && <UploadingOverlay />}

                {/* Hide pencil button when updating */}
                {isOwnProfile && !isUpdatingProfile && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Pencil size={16} />
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                  disabled={isUpdatingProfile}
                />
              </div>

              <div className="mt-4 text-center">
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="bg-gray-800 text-white text-2xl font-bold rounded-md p-2 text-center mb-1"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{userProfile.fullName}</h2>
                )}
                <p className="text-gray-400">
                  {userProfile.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={handleSendMessage}
                  className="flex items-center gap-2 bg-blue-500 py-2 px-6 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <MessageSquare size={20} />
                  Send Message
                </button>
              </div>
            )}

            {/* User Info Section */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              {/* Remove the loading overlay from here */}

              <div className="flex items-center">
                <User size={20} className="text-gray-400 mr-4" />
                <div className="w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      className="bg-gray-800 text-white text-sm rounded-md p-1"
                    />
                  ) : (
                    <p>{userProfile.userName}</p>
                  )}
                </div>
              </div>
              <hr className="border-gray-700 my-4" />
              <div className="flex items-start">
                <FileText size={20} className="text-gray-400 mr-4 mt-1" />
                <div className="w-full">
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="bg-gray-800 text-white w-full rounded-md p-2"
                      rows="3"
                    />
                  ) : (
                    <p className="text-gray-300">
                      {userProfile.bio || "Add a few words about yourself"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-700 py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-500 py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </BorderAnimatedContainer>
    </div>
  );
};

export default ProfilePage;
