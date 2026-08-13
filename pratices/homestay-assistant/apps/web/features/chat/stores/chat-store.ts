import { create } from "zustand";

/**
 * Outbound message queue and guest-facing chat action errors.
 * activeThreadId lives in features/threads/store/thread-store.
 */
interface ChatStore {
  pendingOutboundMessages: Record<string, string | undefined>;
  actionError: string | null;
  setPendingOutboundMessage: (scopeKey: string, message: string) => void;
  clearPendingOutboundMessage: (scopeKey: string) => void;
  consumePendingOutboundMessage: (scopeKey: string) => string | undefined;
  setActionError: (message: string) => void;
  clearActionError: () => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  pendingOutboundMessages: {},
  actionError: null,
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
  setActionError: (message) => set({ actionError: message }),
  clearActionError: () => set({ actionError: null }),
}));
