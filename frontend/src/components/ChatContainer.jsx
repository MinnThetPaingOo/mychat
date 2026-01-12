import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { useReactionStore } from "../store/useReactionStore";

// const REACTION_EMOJIS = ["👍", "❤️", "😂", "😔", "😮", "😡"];

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // UI States
  // const [activeReactionId, setActiveReactionId] = useState(null);
  // // Temporary local state to show reactions immediately in UI
  // const [localReactions, setLocalReactions] = useState({});
  const {
    REACTION_EMOJIS,
    activeReactionId,
    setActiveReactionId,
    localReactions,
    handleReactionSelect,
  } = useReactionStore();

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    if (socket) {
      socket.emit("chat_open", { withUserId: selectedUser._id });
    }

    return () => {
      unsubscribeFromMessages();
      if (socket) socket.emit("chat_close");
    };
  }, [
    selectedUser._id,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
    socket,
  ]);

  useEffect(() => {
    const { markMessagesAsSeen } = useChatStore.getState();
    if (messages.length > 0) markMessagesAsSeen(selectedUser._id);
  }, [messages, selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className="flex flex-col h-full relative"
      onClick={() => setActiveReactionId(null)}
    >
      <ChatHeader />

      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages?.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${
                  msg.senderId === authUser._id ? "chat-end" : "chat-start"
                }`}
              >
                <div
                  className={`chat-bubble relative transition-all duration-200 cursor-pointer ${
                    msg.senderId === authUser._id
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveReactionId(msg._id);
                  }}
                >
                  {/* --- Floating Emoji Picker --- */}
                  {activeReactionId === msg._id && (
                    <div
                      className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xl rounded-full px-3 py-2 z-50 animate-bounce-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionSelect(emoji, msg._id)}
                          className="hover:scale-150 transition-transform duration-200 px-1 text-xl"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Shared"
                      className="rounded-lg h-48 object-cover mb-2"
                    />
                  )}
                  {msg.video && (
                    <video
                      src={msg.video}
                      controls
                      className="rounded-lg h-48 object-cover mb-2"
                    />
                  )}
                  {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                  <p className="text-[10px] mt-1 opacity-60 flex items-center gap-1 uppercase font-bold">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.senderId === authUser._id && (
                      <span className="ml-1">• {msg.status}</span>
                    )}
                  </p>

                  {/* --- Display Selected Reaction at the Bottom --- */}
                  {(localReactions[msg._id] || msg.reaction) && (
                    <div
                      className={`absolute -bottom-4 ${
                        msg.senderId === authUser._id ? "right-2" : "left-2"
                      } bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-full px-1.5 py-0.5 text-sm shadow-sm animate-in zoom-in duration-300`}
                    >
                      {localReactions[msg._id] || msg.reaction}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: translate(-50%, 10px) scale(0.5);
            opacity: 0;
          }
          70% {
            transform: translate(-50%, -5px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default ChatContainer;
