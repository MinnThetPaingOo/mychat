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
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useParams } from "react-router-dom";
import BorderAnimatedContainer from "../components/borderAnimatedContainer";
import { useChatStore } from "../store/useChatStore";

const ProfilePage = () => {
  const { authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();
  const navigate = useNavigate();
  const { userName } = useParams();

  // This is a mock user object. In a real app, you'd fetch this based on `userName`.
  const profileUser = {
    _id: "mock_user_id_" + userName,
    fullName: "John Doe",
    userName: userName,
    email: "john.doe@example.com",
    profilePicture: "/avatar.png",
    bio: "Available",
  };

  // This check determines if you are viewing your own profile
  const isOwnProfile = true;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profileUser.fullName,
    userName: profileUser.userName,
    bio: profileUser.bio,
  });
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("New profile image selected:", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log("Saving data:", formData);
    setIsEditing(false);
  };

  const handleSendMessage = () => {
    setSelectedUser(profileUser);
    navigate("/chat");
  };

  return (
    <div className="w-full h-full relative max-w-6xl">
      <BorderAnimatedContainer>
        <div className="w-full h-full text-white bg-gray-900 p-4 md:p-8 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate(-1)} // Go back to the previous page
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
                <div className="w-8 h-8" /> // Placeholder for alignment
              )}
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img
                  src={profileUser.profilePicture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                />
                {isOwnProfile && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full hover:bg-blue-600 transition-colors"
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
                  <h2 className="text-2xl font-bold">{profileUser.fullName}</h2>
                )}
                <p className="text-gray-400">online</p>
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
                  {isEditing ? (
                    <input
                      type="text"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      className="bg-gray-800 text-white text-sm rounded-md p-1"
                    />
                  ) : (
                    <p>{profileUser.userName}</p>
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
                    <p className="text-gray-300">{profileUser.bio}</p>
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
