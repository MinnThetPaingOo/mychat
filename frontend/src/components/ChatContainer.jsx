import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useReactionStore } from "../store/useReactionStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
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

  const messageEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const previousMessagesLength = useRef(0);
  const scrollHeightBeforeLoad = useRef(0);
  const isLoadingMoreRef = useRef(false);

  const [hasCheckedConversation, setHasCheckedConversation] = useState(false);

  // Initialize chat when user is selected
  useEffect(() => {
    const initChat = async () => {
      setHasCheckedConversation(false);
      isInitialLoadRef.current = true;
      previousMessagesLength.current = 0;
      scrollHeightBeforeLoad.current = 0;
      isLoadingMoreRef.current = false;

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

      isInitialLoadRef.current = true;
      previousMessagesLength.current = 0;
      scrollHeightBeforeLoad.current = 0;
      isLoadingMoreRef.current = false;
    };
  }, [selectedUser._id]);

  // Mark messages as seen when they appear
  useEffect(() => {
    const { markMessagesAsSeen } = useChatStore.getState();
    if (messages.length > 0) {
      markMessagesAsSeen(selectedUser._id);
    }
  }, [messages, selectedUser._id]);

  // Handle scroll position for different scenarios
  useEffect(() => {
    if (!messageEndRef.current || !messageContainerRef.current) return;

    const container = messageContainerRef.current;

    // Scroll to bottom on initial load
    if (isInitialLoadRef.current && messages.length > 0 && !isMessagesLoading) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "instant" });
        isInitialLoadRef.current = false;
        previousMessagesLength.current = messages.length;
      }, 100);
      return;
    }

    // Keep scroll position when loading older messages
    if (isLoadingMoreRef.current && !isLoadingMore) {
      isLoadingMoreRef.current = false;

      if (scrollHeightBeforeLoad.current > 0) {
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - scrollHeightBeforeLoad.current;
          container.scrollTop = heightDifference;
          scrollHeightBeforeLoad.current = 0;
        });
      }
      previousMessagesLength.current = messages.length;
      return;
    }

    // Auto-scroll when new message arrives (if user is near bottom or sent it)
    if (
      !isInitialLoadRef.current &&
      !isLoadingMore &&
      !isLoadingMoreRef.current &&
      messages.length > previousMessagesLength.current
    ) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      const lastMessage = messages[messages.length - 1];

      if (isNearBottom || lastMessage?.senderId === authUser._id) {
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }

      previousMessagesLength.current = messages.length;
    }
  }, [messages, isMessagesLoading, isLoadingMore, authUser._id]);

  // Track loading state for scroll restoration
  useEffect(() => {
    if (isLoadingMore && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
    }
  }, [isLoadingMore]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight } = e.target;
    const { hasMore, isLoadingMore } = useChatStore.getState();

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      scrollHeightBeforeLoad.current = scrollHeight;
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

  const renderAttachment = (att, idx) => {
    if (att.type === "image") {
      return (
        <div key={idx} className="relative group">
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
              handleFileDownload(att.url, att.name || "image.jpg");
            }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (att.type === "video") {
      return (
        <video
          key={idx}
          src={att.url}
          controls
          className="rounded-lg h-48 object-cover"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    if (att.type === "file") {
      return (
        <button
          key={idx}
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
      );
    }

    return null;
  };

  const renderMessage = (msg) => {
    const messageReactions = localReactions[msg._id] || msg.reactions || [];
    const userReaction = getUserReaction(msg._id, authUser._id);
    const isOwnMessage = msg.senderId === authUser._id;

    return (
      <div
        key={msg._id}
        className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
      >
        <div
          className={`chat-bubble relative transition-all duration-200 cursor-pointer ${
            isOwnMessage
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-200"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveReactionId(msg._id);
          }}
        >
          {/* Emoji picker appears when message is clicked */}
          {activeReactionId === msg._id && (
            <div
              className={`absolute -top-12 sm:-top-14 ${
                isOwnMessage ? "right-0 mr-2 sm:mr-4" : "left-0 ml-2 sm:ml-4"
              } flex items-center gap-0.5 sm:gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xl rounded-full px-2 sm:px-3 py-1.5 sm:py-2 z-50 animate-bounce-in`}
              onClick={(e) => e.stopPropagation()}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionSelect(emoji, msg._id)}
                  className={`hover:scale-125 sm:hover:scale-150 transition-transform duration-200 px-0.5 sm:px-1 text-base sm:text-xl ${
                    userReaction === emoji ? "scale-110 sm:scale-125" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Show attachments if any */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {msg.attachments.map((att, idx) => renderAttachment(att, idx))}
            </div>
          )}

          {msg.text && <p className="leading-relaxed">{msg.text}</p>}

          {/* Message time and status */}
          <p className="text-[10px] mt-1 opacity-60 flex items-center gap-1 uppercase font-bold">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOwnMessage && <span className="ml-1">• {msg.status}</span>}
          </p>

          {/* Show reactions below message */}
          {messageReactions.length > 0 && (
            <div
              className={`absolute -bottom-6 ${
                isOwnMessage ? "right-2" : "left-2"
              } flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full px-2 py-1 shadow-md`}
            >
              {messageReactions.map((reaction) => (
                <div key={reaction.type} className="flex items-center gap-0.5">
                  <span className="text-sm">{EMOJI_MAP[reaction.type]}</span>
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
  };

  return (
    <div
      className="flex flex-col h-full w-full relative"
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
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="loading loading-spinner loading-md text-cyan-500"></div>
              </div>
            )}

            {!hasMore && messages.length > 8 && (
              <div className="text-center text-sm text-slate-500 py-2">
                No more messages
              </div>
            )}

            {messages.map(renderMessage)}

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
            transform: translateY(10px) scale(0.5);
            opacity: 0;
          }
          70% {
            transform: translateY(-5px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
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
