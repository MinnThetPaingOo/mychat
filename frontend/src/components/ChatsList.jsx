import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import useUserStore from "../store/useUserStore";
import { useNavigate } from "react-router-dom";

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    isUsersLoading,
    setSelectedUser,
    subscribeToChatList,
    unsubscribeFromChatList,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { fetchUserProfile } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  useEffect(() => {
    subscribeToChatList();
    return () => unsubscribeFromChatList();
  }, [subscribeToChatList, unsubscribeFromChatList]);

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
          <div className="flex items-center gap-3 flex-row">
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
                  src={chat.profilePicture || "/avatar.png"}
                  alt={chat.fullName}
                />
              </div>
            </div>
            <div
              className="flex-1 overflow-hidden"
              onClick={() => setSelectedUser(chat)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-slate-200 font-medium truncate">
                  {chat.fullName}
                </h4>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-slate-400 text-sm truncate flex-1">
                  {chat.lastMessage
                    ? chat.lastMessage.senderId === authUser?._id
                      ? `You: ${
                          chat.lastMessage.attachments?.length > 0
                            ? "📎 Attachment"
                            : chat.lastMessage.text || "No message"
                        }`
                      : chat.lastMessage.attachments?.length > 0
                        ? "📎 Attachment"
                        : chat.lastMessage.text || "No message"
                    : "No messages yet"}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="bg-cyan-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shrink-0">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ChatsList;
