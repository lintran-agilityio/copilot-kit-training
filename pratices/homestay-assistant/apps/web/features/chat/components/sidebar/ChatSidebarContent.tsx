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
  useConfigureChatSuggestions,
  useChatScroll,
  useAutoThreadTitle,
} from "../../hooks";
import {
  HeaderChat,
  ChatUserMessage,
  ChatWelcomeScreen,
  ChatAssistantMessage,
} from "@/features/chat/components/sidebar";
import { CopilotSuggestion } from "@/components/suggestions/CopilotSuggestion";
import { useThreadContext } from "../../contexts/thread-context";
import { useChatStore } from "../../stores/chat-store";
import { ChatSidebarProps } from "./ChatSidebar";

export const ChatSidebarContent = ({
  className,

  agentId,

  threadId,
}: ChatSidebarProps & { threadId: string }) => {
  useConfigureChatSuggestions({ agentId });

  const { refetchThreads } = useThreadContext();
  const { scopeKey } = useActiveThread(agentId);
  const consumePendingOutboundMessage = useChatStore(
    (state) => state.consumePendingOutboundMessage
  );
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId });
  const agentRef = useRef(agent);
  const copilotkitRef = useRef(copilotkit);
  agentRef.current = agent;
  copilotkitRef.current = copilotkit;
  const isRuntimeConnected = copilotkit.runtimeConnectionStatus === "connected";

  useChatScroll([threadId, agent.messages.length]);

  useAutoThreadTitle({ threadId, messages: agent.messages });

  useEffect(() => {
    const currentAgent = agentRef.current;
    const currentCopilotkit = copilotkitRef.current;

    if (typeof currentAgent.setMessages !== "function") {
      return;
    }

    currentAgent.threadId = threadId;
    currentAgent.setMessages([]);

    const controller = new AbortController();

    const syncThread = async () => {
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

      if (!isRuntimeConnected) {
        return;
      }

      const pendingMessage = scopeKey
        ? consumePendingOutboundMessage(scopeKey)
        : undefined;

      if (!pendingMessage) {
        return;
      }

      currentAgent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: pendingMessage,
      });

      try {
        await currentCopilotkit.runAgent({ agent: currentAgent });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to send pending message", error);
      }
    };

    syncThread();
    return () => controller.abort();
  }, [
    agentId,
    consumePendingOutboundMessage,
    isRuntimeConnected,
    scopeKey,
    threadId,
  ]);

  useEffect(() => {
    if (!agent.isRunning) {
      refetchThreads();
    }
  }, [agent.isRunning, refetchThreads]);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a]",

        className
      )}
    >
      <HeaderChat />

      <div
        data-sidebar-chat
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",

          "[&_.copilotKitChat]:flex [&_.copilotKitChat]:h-full [&_.copilotKitChat]:min-h-0 [&_.copilotKitChat]:flex-col"
        )}
      >
        <CopilotChat
          key={threadId}
          agentId={agentId}
          threadId={threadId}
          autoScroll="pin-to-bottom"
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden pt-4"
          scrollView={{
            className: "min-h-0 flex-1",
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
          suggestionView={{
            suggestion: CopilotSuggestion,

            container: {
              className: "flex flex-wrap gap-2 pointer-events-auto",
            },
          }}
        />
      </div>
    </aside>
  );
};
