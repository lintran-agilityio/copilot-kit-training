import { create } from "zustand";

/**
 * Outbound message queue only.
 * activeThreadId lives in features/threads/store/thread-store.
 */
interface ChatStore {
  pendingOutboundMessages: Record<string, string | undefined>;
  setPendingOutboundMessage: (scopeKey: string, message: string) => void;
  clearPendingOutboundMessage: (scopeKey: string) => void;
  consumePendingOutboundMessage: (scopeKey: string) => string | undefined;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  pendingOutboundMessages: {},
  setPendingOutboundMessage: (scopeKey, message) =>
    set((state) => ({
      pendingOutboundMessages: {
        ...state.pendingOutboundMessages,
        [scopeKey]: message,
      },
    })),
  clearPendingOutboundMessage: (scopeKey) =>
    set((state) => {
      if (!(scopeKey in state.pendingOutboundMessages)) {
        return state;
      }

      const pendingOutboundMessages = { ...state.pendingOutboundMessages };
      delete pendingOutboundMessages[scopeKey];

      return { pendingOutboundMessages };
    }),
  consumePendingOutboundMessage: (scopeKey) => {
    const message = get().pendingOutboundMessages[scopeKey];
    if (!message) {
      return undefined;
    }

    set((state) => {
      const pendingOutboundMessages = { ...state.pendingOutboundMessages };
      delete pendingOutboundMessages[scopeKey];

      return { pendingOutboundMessages };
    });

    return message;
  },
}));
