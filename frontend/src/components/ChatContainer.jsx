import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { useReactionStore } from "../store/useReactionStore";
import { FileIcon, Download } from "lucide-react";

const EMOJI_MAP = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    loadMoreMessages,
    messages,
    isMessagesLoading,
    isLoadingMore,
    hasMore,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [hasCheckedConversation, setHasCheckedConversation] = useState(false);

  const {
    REACTION_EMOJIS,
    activeReactionId,
    setActiveReactionId,
    localReactions,
    handleReactionSelect,
    subscribeToReactions,
    unsubscribeFromReactions,
    getUserReaction,
  } = useReactionStore();

  useEffect(() => {
    const initChat = async () => {
      setHasCheckedConversation(false);
      await getMessagesByUserId(selectedUser._id);
      setHasCheckedConversation(true);
      subscribeToMessages();
      subscribeToReactions();

      if (socket) {
        socket.emit("chat_open", { withUserId: selectedUser._id });
      }
    };

    initChat();

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromReactions();
      if (socket) socket.emit("chat_close");
    };
  }, [selectedUser._id]);

  useEffect(() => {
    const { markMessagesAsSeen } = useChatStore.getState();
    if (messages.length > 0) markMessagesAsSeen(selectedUser._id);
  }, [messages, selectedUser._id]);

  // Scroll to bottom on initial load or new message
  useEffect(() => {
    if (shouldScrollToBottom && messageEndRef.current && !isLoadingMore) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, shouldScrollToBottom, isLoadingMore]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (isLoadingMore && messageContainerRef.current && prevScrollHeight > 0) {
      const newScrollHeight = messageContainerRef.current.scrollHeight;
      messageContainerRef.current.scrollTop =
        newScrollHeight - prevScrollHeight;
      setPrevScrollHeight(0);
    }
  }, [isLoadingMore, prevScrollHeight]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessagesByUserId(selectedUser._id);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, getMessagesByUserId, unsubscribeFromMessages]);

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    const { hasMore, isLoadingMore } = useChatStore.getState();

    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      loadMoreMessages(selectedUser._id);
    }
  };

  const handleFileDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full relative "
      onClick={() => setActiveReactionId(null)}
    >
      <ChatHeader />

      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-6 overflow-y-auto py-8"
      >
        {messages?.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Loading indicator at top */}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="loading loading-spinner loading-md text-cyan-500"></div>
              </div>
            )}

            {/* No more messages indicator */}
            {!hasMore && messages.length > 8 && (
              <div className="text-center text-sm text-slate-500 py-2">
                No more messages
              </div>
            )}

            {messages.map((msg) => {
              const messageReactions =
                localReactions[msg._id] || msg.reactions || [];
              const userReaction = getUserReaction(msg._id, authUser._id);

              return (
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
                    {/* Floating Emoji Picker */}
                    {activeReactionId === msg._id && (
                      <div
                        className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xl rounded-full px-3 py-2 z-50 animate-bounce-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactionSelect(emoji, msg._id)}
                            className={`hover:scale-150 transition-transform duration-200 px-1 text-xl ${
                              userReaction === emoji ? "scale-125" : ""
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Render attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx}>
                            {att.type === "image" && (
                              <div className="relative group">
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="rounded-lg h-48 object-cover cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(att.url, "_blank");
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileDownload(
                                      att.url,
                                      att.name || "image.jpg"
                                    );
                                  }}
                                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Download image"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {att.type === "video" && (
                              <video
                                src={att.url}
                                controls
                                className="rounded-lg h-48 object-cover"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            {att.type === "file" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileDownload(att.url, att.name);
                                }}
                                className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors w-full text-left group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                                  <FileIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm block truncate font-medium">
                                    {att.name}
                                  </span>
                                  {att.size && (
                                    <span className="text-xs text-slate-400">
                                      {(att.size / 1024).toFixed(1)} KB
                                    </span>
                                  )}
                                </div>
                                <Download className="w-5 h-5 flex-shrink-0 text-cyan-400 group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
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

                    {/* Display Reactions */}
                    {messageReactions.length > 0 && (
                      <div
                        className={`absolute -bottom-6 ${
                          msg.senderId === authUser._id ? "right-2" : "left-2"
                        } flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full px-2 py-1 shadow-md`}
                      >
                        {messageReactions.map((reaction) => (
                          <div
                            key={reaction.type}
                            className="flex items-center gap-0.5"
                          >
                            <span className="text-sm">
                              {EMOJI_MAP[reaction.type]}
                            </span>
                            {reaction.count > 1 && (
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                {reaction.count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading || !hasCheckedConversation ? (
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
