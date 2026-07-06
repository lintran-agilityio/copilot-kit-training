import { create } from "zustand";

interface ChatStore {
  currentThreadIds: Record<string, string | undefined>;
  pendingOutboundMessages: Record<string, string | undefined>;
  setCurrentThreadId: (scopeKey: string, threadId: string) => void;
  startNewThread: (scopeKey: string) => string;
  setPendingOutboundMessage: (scopeKey: string, message: string) => void;
  consumePendingOutboundMessage: (scopeKey: string) => string | undefined;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  currentThreadIds: {},
  pendingOutboundMessages: {},
  setCurrentThreadId: (scopeKey, threadId) =>
    set((state) => ({
      currentThreadIds: {
        ...state.currentThreadIds,
        [scopeKey]: threadId,
      },
    })),
  startNewThread: (scopeKey) => {
    const threadId = crypto.randomUUID();

    set((state) => ({
      currentThreadIds: {
        ...state.currentThreadIds,
        [scopeKey]: threadId,
      },
    }));

    return threadId;
  },
  setPendingOutboundMessage: (scopeKey, message) =>
    set((state) => ({
      pendingOutboundMessages: {
        ...state.pendingOutboundMessages,
        [scopeKey]: message,
      },
    })),
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
