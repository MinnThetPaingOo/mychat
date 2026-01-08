import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  updateMessageStatus: async ({ messageId, status }) => {
    const { authUser, socket } = useAuthStore.getState();
    // Emit socket event for real-time update
    if (socket) {
      socket.emit("updateMessageStatus", { messageId, status });
    }
    // Also update via API for persistence
    try {
      await axiosInstance.patch(`/message/status/${messageId}`, {
        userId: authUser._id,
        status,
      });
    } catch (e) {
      // ignore for now
    }
  },
  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

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
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      status: "sent",
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

      // Emit message_delivered back to server
      socket.emit("message_delivered", {
        messageId: newMessage._id,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
      });

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

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("message_delivered");
    socket.off("messages_seen");
  },

  connectUser: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("user_online");
      console.log("User connected and marked as online");
    }
  },
}));
