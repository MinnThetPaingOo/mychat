import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // ========================================
  // STATE
  // ========================================
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  usersOpenMyChat: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  isLoadingMore: false,
  currentPage: 1,
  hasMore: true,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  // ========================================
  // UI STATE SETTERS
  // Simple methods to update UI state
  // ========================================

  /**
   * Sets the active tab (chats/contacts)
   * Used when switching between chats list and contacts list views
   */
  setActiveTab: (tab) => set({ activeTab: tab }),

  /**
   * Sets the currently selected user for chat
   * Triggers when user clicks on a contact/chat to open conversation
   */
  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      messages: [],
      currentPage: 1,
      hasMore: true,
    });
  },

  /**
   * Toggles notification sound on/off
   * Persists preference to localStorage
   */
  toggleSound: () => {
    const newValue = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newValue);
    set({ isSoundEnabled: newValue });
  },

  // ========================================
  // DATA FETCHING (API Calls)
  // Methods that fetch data from backend
  // ========================================

  /**
   * Fetches all available contacts from backend
   * Used in "Contacts" tab to show all users you can chat with
   */
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/contact/suggestedContacts");
      set({ allContacts: res.data.contacts });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /**
   * Fetches users you've chatted with before
   * Used in "Chats" tab to show conversation history
   */
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/contact/chattedContacts");
      set({ chats: res.data.chattedContacts });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /**
   * Fetches last 8 messages between you and a specific user (paginated)
   * Called when opening a chat conversation
   * Automatically marks messages as seen after loading
   */
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true, currentPage: 1, hasMore: true });
    try {
      const res = await axiosInstance.get(
        `/message/lastConversationsWith/${userId}?page=1`,
      );
      const messages = res.data.lastMessages.reverse();
      const hasMore = messages.length === 8 && res.data.hasMore;

      set({
        messages,
        hasMore,
        currentPage: 1,
      });

      if (messages.length > 0) {
        get().markMessagesAsSeen(userId);
      }
    } catch (error) {
      console.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /**
   * Loads more (older) messages when scrolling up
   * Prepends older messages to the existing list
   */
  loadMoreMessages: async (userId) => {
    const { currentPage, hasMore, isLoadingMore, messages } = get();

    // Don't load if no more messages or already loading
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const res = await axiosInstance.get(
        `/message/lastConversationsWith/${userId}?page=${nextPage}`,
      );

      const olderMessages = res.data.lastMessages.reverse();
      const hasMoreMessages = olderMessages.length === 8 && res.data.hasMore;

      set({
        messages: [...olderMessages, ...messages],
        hasMore: hasMoreMessages,
        currentPage: nextPage,
      });
    } catch (error) {
      toast.error("Failed to load more messages");
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // ========================================
  // MESSAGE OPERATIONS
  // Methods for sending messages and updating status
  // ========================================

  /**
   * Sends a new message to the selected user
   * Uses optimistic UI update (shows message immediately before server confirms)
   * Replaces temp message with real message from server on success
   * Removes temp message if sending fails
   */
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    // Show message immediately before server confirms
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      attachments: messageData.attachments || [],
      createdAt: new Date().toISOString(),
      status: "sending",
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/message/send/${selectedUser._id}`,
        messageData,
      );

      const newMessage = res.data.message;

      // Replace temp message with real one from server
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? newMessage : msg,
        ),
      }));

      // Update chats list for sender in real time
      const { chats } = get();
      const existingIndex = chats.findIndex(
        (chat) => chat._id === selectedUser._id,
      );

      let updatedChats;
      if (existingIndex !== -1) {
        updatedChats = chats.map((chat) =>
          chat._id === selectedUser._id
            ? {
                ...chat,
                lastMessage: newMessage,
                unreadCount: chat.unreadCount || 0,
              }
            : chat,
        );
      } else {
        updatedChats = [
          {
            ...selectedUser,
            lastMessage: newMessage,
            unreadCount: 0,
          },
          ...chats,
        ];
      }

      updatedChats.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || 0;
        const timeB = b.lastMessage?.createdAt || 0;
        return new Date(timeB) - new Date(timeA);
      });

      set({ chats: updatedChats });
    } catch (error) {
      // Remove failed message
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  /**
   * Marks messages from a sender as "seen"
   * Called automatically when opening a chat
   * Emits socket event to notify sender and updates local state
   * Only marks messages with status "sent" or "delivered"
   */
  markMessagesAsSeen: async (senderId) => {
    const { authUser, socket } = useAuthStore.getState();
    const { messages, chats } = get();

    // Find messages from sender that are not seen yet
    const unseenMessages = messages.filter(
      (msg) =>
        msg.senderId === senderId &&
        msg.receiverId === authUser._id &&
        (msg.status === "sent" || msg.status === "delivered"),
    );

    if (unseenMessages.length === 0) return;

    const messageIds = unseenMessages.map((msg) => msg._id);

    // Emit to server to mark as seen
    if (socket) {
      socket.emit("messages_seen", {
        messageIds,
        senderId,
        viewerId: authUser._id,
      });
    }

    // Update local state immediately
    set((state) => ({
      messages: state.messages.map((msg) =>
        messageIds.includes(msg._id) ? { ...msg, status: "seen" } : msg,
      ),
    }));

    // Reset unread count for this chat in chats list
    const updatedChats = chats.map((chat) =>
      chat._id === senderId ? { ...chat, unreadCount: 0 } : chat,
    );
    set({ chats: updatedChats });
  },

  // ========================================
  // REAL-TIME SOCKET LISTENERS
  // Methods for subscribing/unsubscribing to live updates
  // ========================================

  /**
   * Sets up socket listeners for real-time updates
   * Called when opening a chat conversation
   * Listens for:
   * - newMessage: Incoming messages from selected user (plays sound if enabled)
   * - message_delivered: Updates message status when delivered to recipient
   * - messages_seen: Updates message status when recipient views them
   */
  _messageHandler: null,
  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove previous handler if any
    if (get()._messageHandler) {
      socket.off("newMessage", get()._messageHandler);
    }

    // Handler only manages the active conversation messages + sound
    const handler = (newMessage) => {
      const currentSelectedUser = get().selectedUser;
      if (!currentSelectedUser) return;

      // Only add to messages if it's from the selected user
      if (newMessage.senderId !== currentSelectedUser._id) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });

      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }
    };

    set({ _messageHandler: handler });
    socket.on("newMessage", handler);

    // Listen for message_delivered event from server
    socket.on("message_delivered", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg,
        ),
      }));
    });

    // Listen for messages_seen event from server
    socket.on("messages_seen", ({ messageIds }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, status: "seen" } : msg,
        ),
      }));
    });
  },

  /**
   * Removes socket listeners for active conversation only
   * Does NOT remove the chat list listener
   */
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handler = get()._messageHandler;
    if (handler) {
      socket.off("newMessage", handler);
      set({ _messageHandler: null });
    }
    socket.off("message_delivered");
    socket.off("messages_seen");
  },

  // ========================================
  // CHAT LIST REAL-TIME LISTENERS
  // Global listener for updating chats list even without selected chat
  // ========================================

  _chatListHandler: null,
  subscribeToChatList: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove previous handler if any
    if (get()._chatListHandler) {
      socket.off("newMessage", get()._chatListHandler);
    }

    const handler = (newMessage) => {
      const { chats, selectedUser } = get();
      const { authUser } = useAuthStore.getState();

      const otherUserId =
        newMessage.senderId === authUser._id
          ? newMessage.receiverId
          : newMessage.senderId;

      let found = false;
      const updatedChats = chats.map((chat) => {
        if (chat._id === otherUserId) {
          found = true;
          return {
            ...chat,
            lastMessage: newMessage,
            unreadCount:
              newMessage.senderId !== authUser._id &&
              selectedUser?._id !== otherUserId
                ? (chat.unreadCount || 0) + 1
                : chat.unreadCount || 0,
          };
        }
        return chat;
      });

      // Sort by most recent message
      updatedChats.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || 0;
        const timeB = b.lastMessage?.createdAt || 0;
        return new Date(timeB) - new Date(timeA);
      });

      set({ chats: updatedChats });

      // If new chat partner not in list, refetch
      if (!found) {
        get().getMyChatPartners();
      }
    };

    set({ _chatListHandler: handler });
    socket.on("newMessage", handler);
  },

  unsubscribeFromChatList: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handler = get()._chatListHandler;
    if (handler) {
      socket.off("newMessage", handler);
      set({ _chatListHandler: null });
    }
  },
}));
