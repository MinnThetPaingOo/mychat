import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import useUserStore from "../store/useUserStore";
import { useNavigate } from "react-router-dom";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const { fetchUserProfile } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;
  const handleProfileClick = async (userName) => {
    await fetchUserProfile(userName);
    navigate(`/${userName}`);
  };
  return (
    <>
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="bg-cyan-500/10 p-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
        >
          <div className="flex items-center gap-2 flex-row ">
            <div
              className={`avatar ${
                onlineUsers.includes(chat._id) ? "avatar-online" : ""
              }`}
            >
              <div
                className="size-12 rounded-full"
                onClick={() => handleProfileClick(chat.userName)}
              >
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt={chat.fullName}
                />
              </div>
            </div>
            <div onClick={() => setSelectedUser(chat)}>
              <h4 className="text-slate-200 font-medium truncate w-55 md:w-28 lg:w-42 h-10">
                {chat.fullName}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ChatsList;
