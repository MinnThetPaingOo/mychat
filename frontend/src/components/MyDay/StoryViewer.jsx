import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyDayStore } from "../../store/useMyDayStore";
import { useAuthStore } from "../../store/useAuthStore";
import ConfirmDialog from "../ConfirmDialog";

const StoryViewer = ({ userId, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();
  const {
    userStories,
    fetchUserStories,
    markAsViewed,
    deleteStory,
    isViewing,
  } = useMyDayStore();
  const { authUser } = useAuthStore();

  const currentStory = userStories[currentIndex];
  const isMyStory = currentStory?.userId === authUser?._id;
  const viewCount = currentStory?.views?.length || 0;
  const STORY_DURATION = 5000;

  useEffect(() => {
    fetchUserStories(userId);
  }, [userId, fetchUserStories]);

  useEffect(() => {
    if (!currentStory || isPaused) return;

    markAsViewed(currentStory._id);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / (STORY_DURATION / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, currentStory]);

  const handleNext = () => {
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!isMyStory) return;

    await deleteStory(currentStory._id);
    if (userStories.length === 1) {
      onClose();
    } else {
      handleNext();
    }
  };

  if (isViewing || !currentStory) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {userStories.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width:
                  i < currentIndex
                    ? "100%"
                    : i === currentIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate(`/${currentStory.userName}`)}
        >
          <img
            src={currentStory.profilePicture || "/avatar.png"}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-white font-medium">{currentStory.fullName}</p>
            <p className="text-white/70 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {isMyStory && (
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setIsPaused(true);
              }}
              className="text-white"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={onClose} className="text-white">
            <X size={24} />
          </button>
        </div>
      </div>

      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: currentStory.backgroundColor }}
      >
        {currentStory.mediaType ? (
          currentStory.mediaType === "image" ? (
            <img
              src={currentStory.mediaUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <video
              src={currentStory.mediaUrl}
              className="max-h-full max-w-full"
              autoPlay
              muted
            />
          )
        ) : (
          <p className="text-white text-2xl text-center p-8 max-w-lg">
            {currentStory.caption}
          </p>
        )}

        {currentStory.caption && currentStory.mediaType && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <p className="text-white text-center bg-black/50 py-2 px-4 rounded-lg">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* View Count - Bottom Left (like Facebook) */}
      {isMyStory && viewCount > 0 && (
        <button
          onClick={() => {
            setShowViewers(!showViewers);
            setIsPaused(!showViewers);
          }}
          className="absolute bottom-6 left-4 flex items-center gap-2 text-white bg-black/60 px-3 py-2 rounded-full z-20"
        >
          <Eye size={18} />
          <span className="text-sm font-medium">{viewCount}</span>
        </button>
      )}

      {/* Viewers List Modal */}
      {isMyStory && showViewers && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6 z-20 max-h-[40vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Eye size={18} />
              Viewed by {viewCount} {viewCount === 1 ? "person" : "people"}
            </h3>
            <button
              onClick={() => {
                setShowViewers(false);
                setIsPaused(false);
              }}
              className="text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {currentStory.views.map((view, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white bg-white/10 rounded-lg p-2"
              >
                <img
                  src={view.user?.profilePicture || "/avatar.png"}
                  alt={view.user?.fullName}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (view.user?.userName) {
                      navigate(`/${view.user.userName}`);
                    }
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {view.user?.fullName || "Unknown User"}
                  </p>
                  <p className="text-xs text-white/60">
                    {new Date(view.viewedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-10"
        >
          <ChevronLeft size={32} />
        </button>
      )}
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-10"
      >
        <ChevronRight size={32} />
      </button>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setIsPaused(false);
        }}
        onConfirm={handleDelete}
        title="Delete Story?"
        message="Are you sure you want to delete this story?"
      />
    </div>
  );
};

export default StoryViewer;
