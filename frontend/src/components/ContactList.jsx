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
          className="bg-cyan-500/10 p-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
        >
          <div className="flex items-center gap-2 flex-row ">
            <div
              className={`avatar ${
                onlineUsers.includes(contact._id) ? "avatar-online" : ""
              }`}
            >
              <div
                className="size-12 rounded-full"
                onClick={() => handleProfileClick(contact.userName)}
              >
                <img src={contact.profilePicture || "/avatar.png"} />
              </div>
            </div>
            <div onClick={() => setSelectedUser(contact)}>
              <h4 className="text-slate-200 font-medium w-55 md:w-28 lg:w-42 h-10">
                {contact.fullName}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
