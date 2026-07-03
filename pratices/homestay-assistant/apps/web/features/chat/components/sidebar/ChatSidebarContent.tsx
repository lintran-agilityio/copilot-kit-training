import { useEffect, useRef } from "react";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";

import { cn } from "@repo/utils";
import { scrollChatToEnd } from "../../utils";
import { WELCOME_MESSAGE } from "../../constants";
import {
  hydrateThreadMessages,
  useActiveThread,
  useChatSuggestions,
  useChatScroll,
  useAutoThreadTitle,
} from "../../hooks";
import {
  HeaderChat,
  ChatUserMessage,
  ChatWelcomeScreen,
  ChatAssistantMessage,
} from "@/features/chat/components/sidebar";
import { useThreadContext } from "../../contexts/thread-context";
import { useChatStore } from "../../stores/chat-store";
import { ChatSidebarProps } from "./ChatSidebar";
import { SuggestionBar } from "@/components/suggestions";

export const ChatSidebarContent = ({
  className,

  agentId,

  threadId,
}: ChatSidebarProps & { threadId: string }) => {
  const suggestions = useChatSuggestions();

  const { refetchThreads } = useThreadContext();
  const { scopeKey } = useActiveThread(agentId);
  const consumePendingOutboundMessage = useChatStore(
    (state) => state.consumePendingOutboundMessage,
  );
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId });
  const agentRef = useRef(agent);
  const copilotkitRef = useRef(copilotkit);
  const isRuntimeConnectedRef = useRef(
    copilotkit.runtimeConnectionStatus === "connected",
  );
  const wasRuntimeConnectedRef = useRef(isRuntimeConnectedRef.current);
  agentRef.current = agent;
  copilotkitRef.current = copilotkit;
  isRuntimeConnectedRef.current =
    copilotkit.runtimeConnectionStatus === "connected";

  const isRuntimeConnected =
    copilotkit.runtimeConnectionStatus === "connected";

  useChatScroll([threadId, agent.messages.length]);

  useAutoThreadTitle({ threadId, messages: agent.messages });

  const sendPendingMessageRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  sendPendingMessageRef.current = async () => {
    if (!isRuntimeConnectedRef.current || !scopeKey) {
      return;
    }

    const pendingMessage = consumePendingOutboundMessage(scopeKey);
    if (!pendingMessage) {
      return;
    }

    const currentAgent = agentRef.current;
    const currentCopilotkit = copilotkitRef.current;

    if (currentAgent.threadId !== threadId) {
      currentAgent.threadId = threadId;
    }

    currentAgent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: pendingMessage,
    });

    try {
      await currentCopilotkit.runAgent({ agent: currentAgent });
    } catch (error) {
      console.error("Failed to send pending message", error);
    }
  };

  // Load persisted history when the active thread changes.
  useEffect(() => {
    const currentAgent = agentRef.current;

    if (typeof currentAgent.setMessages !== "function") {
      return;
    }

    currentAgent.threadId = threadId;
    currentAgent.setMessages([]);

    const controller = new AbortController();

    const loadHistory = async () => {
      await hydrateThreadMessages({
        threadId,
        agentId,
        setMessages: currentAgent.setMessages.bind(currentAgent),
        onHydrated: () => requestAnimationFrame(() => scrollChatToEnd("auto")),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      await sendPendingMessageRef.current?.();
    };

    loadHistory();

    return () => controller.abort();
  }, [agentId, threadId]);

  // Send a draft-panel message when the runtime connects after hydration.
  useEffect(() => {
    const wasConnected = wasRuntimeConnectedRef.current;
    wasRuntimeConnectedRef.current = isRuntimeConnected;

    if (!isRuntimeConnected || wasConnected) {
      return;
    }

    sendPendingMessageRef.current?.();
  }, [isRuntimeConnected, scopeKey, threadId]);

  useEffect(() => {
    if (!agent.isRunning) {
      refetchThreads();
    }
  }, [agent.isRunning, refetchThreads]);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a]",

        className,
      )}
    >
      <HeaderChat />

      <div
        data-sidebar-chat
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden items-bottom",
          "[&_.copilotKitChat]:flex [&_.copilotKitChat]:h-full [&_.copilotKitChat]:min-h-0 [&_.copilotKitChat]:flex-col",
        )}
      >
        <SuggestionBar suggestions={suggestions} />
        <CopilotChat
          key={threadId}
          agentId={agentId}
          threadId={threadId}
          autoScroll="pin-to-bottom"
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden pt-4"
          scrollView={{
            className: "app-scrollbar min-h-0 flex-1",
          }}
          labels={{
            chatInputPlaceholder: "Ask me anything...",

            welcomeMessageText: WELCOME_MESSAGE,
          }}
          welcomeScreen={ChatWelcomeScreen}
          messageView={{
            className: "px-4",

            assistantMessage:
              ChatAssistantMessage as typeof CopilotChatAssistantMessage,

            userMessage: ChatUserMessage as typeof CopilotChatUserMessage,
          }}
          input={{
            showDisclaimer: false,

            bottomAnchored: true,

            className: "pointer-events-auto m-4",
          }}
        />
      </div>
    </aside>
  );
};
