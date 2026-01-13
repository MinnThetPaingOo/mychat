import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { axiosInstance } from "../lib/axios";

const REACTION_MAP = {
  "👍": "like",
  "❤️": "love",
  "😂": "haha",
  "😮": "wow",
  "😢": "sad",
  "😡": "angry",
};

const EMOJI_MAP = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

export const useReactionStore = create((set, get) => ({
  REACTION_EMOJIS: ["👍", "❤️", "😂", "😮", "😢", "😡"],
  activeReactionId: null,
  localReactions: {}, // messageId: [{ type, count, users }]

  setActiveReactionId: (id) => set({ activeReactionId: id }),

  handleReactionSelect: async (emoji, messageId) => {
    const { localReactions } = get();
    const { authUser } = useAuthStore.getState();
    const reactionType = REACTION_MAP[emoji];

    if (!reactionType) {
      console.error("Invalid emoji");
      return;
    }

    // Optimistic update
    const currentReactions = localReactions[messageId] || [];
    let newReactions = JSON.parse(JSON.stringify(currentReactions));

    // Find if user already reacted with this type
    const reactionIndex = newReactions.findIndex(
      (r) => r.type === reactionType
    );
    const userAlreadyReacted =
      reactionIndex !== -1 &&
      newReactions[reactionIndex].users.includes(authUser._id);

    if (userAlreadyReacted) {
      // Remove reaction
      newReactions[reactionIndex].users = newReactions[
        reactionIndex
      ].users.filter((id) => id !== authUser._id);
      newReactions[reactionIndex].count -= 1;

      if (newReactions[reactionIndex].count === 0) {
        newReactions.splice(reactionIndex, 1);
      }
    } else {
      // Remove user from other reactions (user can only react once)
      newReactions = newReactions
        .map((r) => ({
          ...r,
          users: r.users.filter((id) => id !== authUser._id),
          count: r.users.filter((id) => id !== authUser._id).length,
        }))
        .filter((r) => r.count > 0);

      // Add new reaction
      if (reactionIndex !== -1) {
        newReactions[reactionIndex].users.push(authUser._id);
        newReactions[reactionIndex].count += 1;
      } else {
        newReactions.push({
          type: reactionType,
          count: 1,
          users: [authUser._id],
        });
      }
    }

    set({
      localReactions: {
        ...localReactions,
        [messageId]: newReactions,
      },
      activeReactionId: null,
    });

    try {
      const response = await axiosInstance.post(`/reaction/${messageId}`, {
        reactionType,
      });

      // Update with server response
      set({
        localReactions: {
          ...get().localReactions,
          [messageId]: response.data.reactions,
        },
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      // Revert on error
      set({
        localReactions: {
          ...get().localReactions,
          [messageId]: currentReactions,
        },
      });
    }
  },

  subscribeToReactions: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("messageReaction", ({ messageId, reactions }) => {
      const { localReactions } = get();
      set({
        localReactions: {
          ...localReactions,
          [messageId]: reactions,
        },
      });

      // Update message in chat store
      const { messages, setMessages } = useChatStore.getState();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? { ...msg, reactions } : msg
      );
      setMessages(updatedMessages);
    });
  },

  unsubscribeFromReactions: () => {
    const { socket } = useAuthStore.getState();
    if (socket) {
      socket.off("messageReaction");
    }
  },

  getUserReaction: (messageId, userId) => {
    const { localReactions } = get();
    const reactions = localReactions[messageId] || [];

    for (const reaction of reactions) {
      if (reaction.users.includes(userId)) {
        return EMOJI_MAP[reaction.type];
      }
    }
    return null;
  },
}));
