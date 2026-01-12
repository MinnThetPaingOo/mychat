import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useReactionStore = create((set, get) => ({
  REACTION_EMOJIS: ["👍", "❤️", "😂", "😔", "😮", "😡"],
  activeReactionId: null,
  setActiveReactionId: (id) => set({ activeReactionId: id }),
  localReactions: {},
  handleReactionSelect: async (emoji, messageId) => {
    set((state) => ({
      localReactions: {
        ...state.localReactions,
        [messageId]: emoji,
      },
      activeReactionId: null,
    }));

    // Store reaction in real DB via API using axiosInstance
    try {
      const response = await axiosInstance.post("/reaction/", {
        messageId,
        emoji,
      });
      console.log("Reaction saved:", response.data);
    } catch (err) {
      console.error("Failed to save reaction:", err);
    }
  },
}));
