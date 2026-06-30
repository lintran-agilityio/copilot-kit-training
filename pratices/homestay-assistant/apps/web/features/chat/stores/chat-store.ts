import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatStore {
  activeThreadIds: Record<string, string | undefined>;
  preferDraftMode: Record<string, boolean | undefined>;
  pendingOutboundMessages: Record<string, string | undefined>;
  threadTitles: Record<string, string | undefined>;
  setActiveThreadId: (scopeKey: string, threadId: string) => void;
  clearActiveThreadId: (scopeKey: string) => void;
  setPreferDraftMode: (scopeKey: string, enabled: boolean) => void;
  setPendingOutboundMessage: (scopeKey: string, message: string) => void;
  consumePendingOutboundMessage: (scopeKey: string) => string | undefined;
  setThreadTitle: (threadId: string, title: string) => void;
  startNewConversation: (
    scopeKey: string,
    threadId: string,
    message: string,
  ) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      activeThreadIds: {},
      preferDraftMode: {},
      pendingOutboundMessages: {},
      threadTitles: {},
      setActiveThreadId: (scopeKey, threadId) =>
        set((state) => ({
          activeThreadIds: {
            ...state.activeThreadIds,
            [scopeKey]: threadId,
          },
          preferDraftMode: {
            ...state.preferDraftMode,
            [scopeKey]: false,
          },
        })),
      clearActiveThreadId: (scopeKey) =>
        set((state) => {
          const { [scopeKey]: _removed, ...activeThreadIds } =
            state.activeThreadIds;

          return {
            activeThreadIds,
            preferDraftMode: {
              ...state.preferDraftMode,
              [scopeKey]: true,
            },
          };
        }),
      setPreferDraftMode: (scopeKey, enabled) =>
        set((state) => ({
          preferDraftMode: {
            ...state.preferDraftMode,
            [scopeKey]: enabled,
          },
        })),
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
          const { [scopeKey]: _removed, ...pendingOutboundMessages } =
            state.pendingOutboundMessages;

          return { pendingOutboundMessages };
        });

        return message;
      },
      setThreadTitle: (threadId, title) =>
        set((state) => ({
          threadTitles: {
            ...state.threadTitles,
            [threadId]: title,
          },
        })),
      startNewConversation: (scopeKey, threadId, message) =>
        set((state) => ({
          activeThreadIds: {
            ...state.activeThreadIds,
            [scopeKey]: threadId,
          },
          preferDraftMode: {
            ...state.preferDraftMode,
            [scopeKey]: false,
          },
          pendingOutboundMessages: {
            ...state.pendingOutboundMessages,
            [scopeKey]: message,
          },
        })),
    }),
    {
      name: "homestay-chat-store",
      partialize: (state) => ({
        activeThreadIds: state.activeThreadIds,
        threadTitles: state.threadTitles,
      }),
      skipHydration: true,
    },
  ),
);

export const useChatStoreHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const persist = useChatStore.persist;
    if (!persist) {
      return;
    }

    const unsub = persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (persist.hasHydrated()) {
      setHasHydrated(true);
    } else {
      void persist.rehydrate();
    }

    return unsub;
  }, []);

  return hasHydrated;
};
