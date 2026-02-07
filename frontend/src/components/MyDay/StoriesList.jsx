import { useEffect } from "react";
import { Plus } from "lucide-react";
import { useMyDayStore } from "../../store/useMyDayStore";
import { useAuthStore } from "../../store/useAuthStore";

const StoriesList = ({ onStoryClick, onCreateClick }) => {
  const { contactsStories, isLoadingStories, fetchContactsStories } =
    useMyDayStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    fetchContactsStories();
  }, [fetchContactsStories]);

  if (isLoadingStories) {
    return (
      <div className="flex gap-3 overflow-x-auto px-4 py-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="skeleton w-14 h-14 rounded-full" />
            <div className="skeleton h-2.5 w-10" />
          </div>
        ))}
      </div>
    );
  }

  // Sort to show user's own stories first
  const sortedStories = [...contactsStories].sort((a, b) => {
    if (a.user._id === authUser?._id) return -1;
    if (b.user._id === authUser?._id) return 1;
    return 0;
  });

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-hide">
      <div
        className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
        onClick={onCreateClick}
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <Plus size={20} className="text-white" />
          </div>
        </div>
        <span className="text-[10px] font-medium text-slate-300">
          Your Story
        </span>
      </div>

      {sortedStories.map(({ user, stories }) => {
        const hasUnviewed = stories.some(
          (s) => !s.views.some((v) => v.userId === authUser?._id),
        );

        return (
          <div
            key={user._id}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
            onClick={() => onStoryClick(user._id)}
          >
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full p-0.5 ${
                  hasUnviewed
                    ? "bg-gradient-to-br from-cyan-400 to-cyan-600"
                    : "bg-slate-600"
                }`}
              >
                <div className="w-full h-full rounded-full border-2 border-slate-800 overflow-hidden">
                  <img
                    src={user.profilePicture || "/avatar.png"}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-800 text-[9px] text-white flex items-center justify-center font-bold">
                {stories.length}
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-300 truncate max-w-[56px]">
              {user.fullName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StoriesList;
