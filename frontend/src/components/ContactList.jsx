import { useEffect } from "react";
import React from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import useUserStore from "../store/useUserStore";
import { useNavigate } from "react-router-dom";

// Memoized contact item component - prevents unnecessary re-renders
const ContactItem = React.memo(
  ({ contact, isOnline, onSelect, onProfileClick }) => (
    <div
      key={contact._id}
      className="bg-cyan-500/10 p-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
    >
      <div className="flex items-center gap-2 flex-row">
        <div className={`avatar ${isOnline ? "avatar-online" : ""}`}>
          <div
            className="size-12 rounded-full"
            onClick={() => onProfileClick(contact.userName)}
          >
            <img src={contact.profilePicture || "/avatar.png"} />
          </div>
        </div>
        <div onClick={() => onSelect(contact)}>
          <h4 className="text-slate-200 font-medium w-55 md:w-28 lg:w-42 h-10">
            {contact.fullName}
          </h4>
        </div>
      </div>
    </div>
  ),
  (prevProps, nextProps) => {
    // Custom comparison: re-render only if contact data or online status changed
    return (
      prevProps.contact._id === nextProps.contact._id &&
      prevProps.isOnline === nextProps.isOnline
    );
  },
);
ContactItem.displayName = "ContactItem";

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
        <ContactItem
          key={contact._id}
          contact={contact}
          isOnline={onlineUsers.includes(contact._id)}
          onSelect={setSelectedUser}
          onProfileClick={handleProfileClick}
        />
      ))}
    </>
  );
}
export default ContactList;
