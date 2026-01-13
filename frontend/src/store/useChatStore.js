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
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  /**
   * Toggles notification sound on/off
   * Persists preference to localStorage
   */
  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
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
      const res = await axiosInstance.get("/contact/getAllContacts");
      set({ allContacts: res.data.contacts });
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /**
   * Fetches all messages between you and a specific user
   * Called when opening a chat conversation
   * Automatically marks messages as seen after loading
   */
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/conversations/${userId}`);
      console.log("Messages fetched:", res.data.messages);
      set({ messages: res.data.messages });

      // Mark messages as seen when opening chat
      get().markMessagesAsSeen(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
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

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      attachments: messageData.attachments || [], // Changed from image/video
      createdAt: new Date().toISOString(),
      status: "sending",
      isOptimistic: true,
    };

    // Immediately update the UI by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/message/send/${selectedUser._id}`,
        messageData
      );

      // Replace optimistic message with real message
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? res.data.message : msg
        ),
      }));
    } catch (error) {
      // Remove optimistic message on failure
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Something went wrong");
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
    const { messages } = get();

    // Find messages from sender that are not seen yet
    const unseenMessages = messages.filter(
      (msg) =>
        msg.senderId === senderId &&
        msg.receiverId === authUser._id &&
        (msg.status === "sent" || msg.status === "delivered")
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
        messageIds.includes(msg._id) ? { ...msg, status: "seen" } : msg
      ),
    }));
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
  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }
    });

    // Listen for message_delivered event from server
    socket.on("message_delivered", ({ messageId }) => {
      console.log("Message delivered:", messageId);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg
        ),
      }));
    });

    // Listen for messages_seen event from server
    socket.on("messages_seen", ({ messageIds }) => {
      console.log("Messages seen:", messageIds);
      set((state) => ({
        messages: state.messages.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, status: "seen" } : msg
        ),
      }));
    });
  },

  /**
   * Removes all socket listeners for messages
   * Called when closing a chat or unmounting chat component
   * Prevents memory leaks and duplicate event handlers
   */
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("message_delivered");
    socket.off("messages_seen");
  },

  // connectUser: () => {
  //   const socket = useAuthStore.getState().socket;
  //   if (socket) {
  //     socket.emit("user_online");
  //     console.log("User connected and marked as online");
  //   }
  // },
}));
