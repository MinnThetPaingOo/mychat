import React, { useEffect, useRef } from "react";
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  Pencil,
  User,
  Check,
  X,
  Loader,
  MoreVertical,
  Edit,
  Settings,
} from "lucide-react";
import useUserStore from "../store/useUserStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useParams } from "react-router-dom";
import BorderAnimatedContainer from "../components/borderAnimatedContainer";
import { useChatStore } from "../store/useChatStore";
import UploadingOverlay from "../components/UploadingOverlay";

const ProfilePage = () => {
  const {
    userProfile,
    isLoadingProfilePage,
    updateProfile,
    isUpdatingPP,
    checkUserNameAvailable,
    isCheckingUserName,
    isAvailableUserName,
    userNameSearchResult,
    updateInfo,
    isSavingProfileInfo,
    showMenu,
    isEditingInfo,
    setShowMenu,
    setIsEditingInfo,
    fetchUserProfile,
    clearUserProfile,
  } = useUserStore();
  const { authUser, onlineUsers } = useAuthStore();
  const { setSelectedUser } = useChatStore();
  const navigate = useNavigate();
  const { userName } = useParams();
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUserProfile(userName);
    return () => {
      clearUserProfile();
    };
  }, [userName]);

  // Check username availability when editing and username changes
  useEffect(() => {
    checkUserNameAvailable(userProfile?.userName);
  }, [userProfile?.userName]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowMenu]);

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
    let { name, value } = e.target;

    // Prevent spaces in username
    if (name === "userName") {
      value = value.replace(/\s/g, "");
    }

    useUserStore.setState((state) => ({
      userProfile: {
        ...state.userProfile,
        [name]: value,
      },
    }));
  };

  const handleSave = async () => {
    const { fullName, userName: newUserName, bio } = userProfile;
    const data = {
      fullName,
      userName: newUserName,
      bio,
      isAvailableUserName,
    };
    const updatedUserName = await updateInfo(data);
    setIsEditingInfo(false);

    if (updatedUserName) {
      navigate(`/${updatedUserName}`);
    } else {
      fetchUserProfile(userName);
    }
  };

  const handleCancel = () => {
    setIsEditingInfo(false);
    fetchUserProfile(userName);
  };

  const handleSendMessage = () => {
    if (userProfile) {
      setSelectedUser(userProfile);
      navigate("/");
    }
  };

  const handleEditInfo = () => {
    setIsEditingInfo(true);
    setShowMenu(false);
  };

  const handleAccountSettings = () => {
    setShowMenu(false);
    navigate(`/${userName}/settings`);
  };

  // Show loading state while fetching data
  if (isLoadingProfilePage || !userProfile) {
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
                onClick={() => navigate("/")}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              {isOwnProfile && !isEditingInfo ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <MoreVertical size={24} />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-10">
                      <button
                        onClick={handleEditInfo}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                      >
                        <Edit size={18} className="text-blue-400" />
                        <span>Edit Info</span>
                      </button>
                      <div className="border-t border-gray-700"></div>
                      <button
                        onClick={handleAccountSettings}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                      >
                        <Settings size={18} className="text-gray-400" />
                        <span>Account Settings</span>
                      </button>
                    </div>
                  )}
                </div>
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
                {isUpdatingPP && <UploadingOverlay />}

                {/* Hide pencil button when updating */}
                {isOwnProfile && !isUpdatingPP && (
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
                  disabled={isUpdatingPP}
                />
              </div>

              <div className="mt-4 text-center">
                {isEditingInfo ? (
                  <input
                    type="text"
                    name="fullName"
                    value={userProfile.fullName}
                    onChange={handleInputChange}
                    className="bg-gray-800 text-white text-2xl font-bold rounded-md p-2 text-center mb-1"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{userProfile.fullName}</h2>
                )}
                <p className="text-gray-400">
                  {onlineUsers.includes(userProfile._id) ? "Online" : "Offline"}
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
              <div className="flex items-center">
                <User size={20} className="text-gray-400 mr-4" />
                <div className="w-full">
                  {isEditingInfo ? (
                    <div className="relative">
                      <div className="flex items-center">
                        <input
                          type="text"
                          name="userName"
                          value={userProfile.userName}
                          onChange={handleInputChange}
                          className="bg-gray-800 text-white text-sm rounded-md p-1 pr-8 w-full"
                          placeholder="Enter username"
                        />
                        <div className="absolute right-2 flex items-center">
                          {isCheckingUserName ? (
                            <Loader
                              size={16}
                              className="animate-spin text-gray-400"
                            />
                          ) : userNameSearchResult ? (
                            isAvailableUserName ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <X size={16} className="text-red-500" />
                            )
                          ) : null}
                        </div>
                      </div>
                      {/* Username availability message */}
                      {userNameSearchResult && (
                        <p
                          className={`text-xs mt-1 ${
                            isCheckingUserName
                              ? "text-gray-400"
                              : isAvailableUserName
                                ? "text-green-500"
                                : "text-red-500"
                          }`}
                        >
                          {userNameSearchResult}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>{userProfile.userName}</p>
                  )}
                </div>
              </div>

              <hr className="border-gray-700 my-4" />
              <div className="flex items-start">
                <FileText size={20} className="text-gray-400 mr-4 mt-1" />
                <div className="w-full">
                  {isEditingInfo ? (
                    <textarea
                      name="bio"
                      value={userProfile.bio}
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

            {isEditingInfo && (
              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={handleCancel}
                  className="bg-gray-700 py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`bg-blue-500 py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 ${
                    isSavingProfileInfo ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isSavingProfileInfo}
                >
                  {isSavingProfileInfo ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
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
