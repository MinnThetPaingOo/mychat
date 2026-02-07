import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { StoriesList, CreateStoryModal, StoryViewer } from "./MyDay";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const navigate = useNavigate();
  const showProfile = () => {
    navigate(`/${authUser.userName}`);
  };

  return (
    <>
      <div className="border-b border-slate-700/50">
        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* AVATAR */}
              <div className="avatar avatar-online">
                <button
                  className="size-14 rounded-full overflow-hidden relative group"
                  onClick={() => showProfile()}
                >
                  <img
                    src={
                      selectedImg || authUser.profilePicture || "/avatar.png"
                    }
                    alt="User image"
                    className="size-full object-cover"
                  />
                  {/* <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div> */}
                </button>

                {/* <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            /> */}
              </div>

              {/* USERNAME & ONLINE TEXT */}
              <div>
                <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
                  {authUser.fullName}
                </h3>

                <p className="text-slate-400 text-xs">Online</p>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 items-center">
              {/* LOGOUT BTN */}
              <button
                className="text-slate-400 hover:text-slate-200 transition-colors"
                onClick={logout}
              >
                <LogOutIcon className="size-5" />
              </button>

              {/* SOUND TOGGLE BTN */}
              <button
                className="text-slate-400 hover:text-slate-200 transition-colors"
                onClick={() => {
                  // play click sound before toggling
                  mouseClickSound.currentTime = 0; // reset to start
                  mouseClickSound
                    .play()
                    .catch((error) => console.log("Audio play failed:", error));
                  toggleSound();
                }}
              >
                {isSoundEnabled ? (
                  <Volume2Icon className="size-5" />
                ) : (
                  <VolumeOffIcon className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MyDay Stories Section */}
        <div className="bg-slate-800/30">
          <StoriesList
            onCreateClick={() => setShowCreateModal(true)}
            onStoryClick={(userId) => setViewingUserId(userId)}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateStoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {viewingUserId && (
        <StoryViewer
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}
    </>
  );
}
export default ProfileHeader;
