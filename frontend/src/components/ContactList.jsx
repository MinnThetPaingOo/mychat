import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import useUserStore from "../store/useUserStore";
import { useNavigate } from "react-router-dom";
function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const { fetchUserProfile } = useUserStore();
  const navigate = useNavigate();
  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const handleProfileClick = async (userName) => {
    await fetchUserProfile(userName);
    navigate(`/${userName}`);
  };

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            {/* TODO: MAKE IT WORK WITH SOCKET */}
            <div
              className={`avatar ${
                onlineUsers.includes(contact._id) ? "avatar-online" : ""
              }`}
            >
              <div
                className="size-12 rounded-full"
                onClick={() => handleProfileClick(contact.userName)}
              >
                <img src={contact.profilePic || "/avatar.png"} />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
