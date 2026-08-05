"use client";

import { useEffect, useRef, useState } from "react";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
  CopilotKitCoreErrorCode,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";

import { cn } from "@repo/utils";
import { WELCOME_MESSAGE } from "@/features/chat/constants";
import {
  useChatSuggestions,
  useChatScroll,
  useResetConversation,
  useSilenceStopRunErrors,
  useStopGeneration,
  useThreadMessages,
} from "@/features/chat/hooks";
import {
  HeaderChat,
  ChatUserMessage,
  ChatWelcomeScreen,
  ChatAssistantMessage,
  ChatLoadingCursor,
} from "@/features/chat/components";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { ChatSidebarProps } from "@/features/chat/components/ChatSidebar";
import {
  isStopRelatedAgentError,
  runAgentSafely,
} from "@/features/chat/utils/agent-run";
import { SuggestionBar } from "@/components/suggestions";
import { ThreadLoadingStateView } from "@/features/threads/components";
import { useChatSession } from "@/features/threads/hooks/useChatSession";

type CopilotKitErrorPayload = {
  error: Error;
  code: CopilotKitCoreErrorCode;
  context: { runtimeErrorCode?: string };
};

const isCopilotKitError = (
  value: unknown,
): value is CopilotKitErrorPayload => {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value
  );
}

export const ChatSidebarContent = ({
  className,
  agentId,
}: ChatSidebarProps) => {
  const suggestions = useChatSuggestions({ agentId });
  const { resetConversation } = useResetConversation({ agentId });
  const { stopGeneration } = useStopGeneration({ agentId });
  useSilenceStopRunErrors({ agentId });
  const {
    scopeKey,
    activeThreadId,
    loadingState,
    error: loadError,
    requestReload,
  } = useChatSession({ agentId });
  const consumePendingOutboundMessage = useChatStore(
    (state) => state.consumePendingOutboundMessage,
  );
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId });
  const [hasHydrated, setHasHydrated] = useState(false);
  const isThreadLoading = loadingState === "loading";
  const isThreadError = loadingState === "error";
  const agentRef = useRef(agent);
  const copilotkitRef = useRef(copilotkit);
  const wasRuntimeConnectedRef = useRef(
    copilotkit.runtimeConnectionStatus === "connected",
  );
  agentRef.current = agent;
  copilotkitRef.current = copilotkit;

  const isRuntimeConnected =
    copilotkit.runtimeConnectionStatus === "connected";
  const displayedOnlineStatus = hasHydrated && isRuntimeConnected;

  const contentKey = agent.messages
    .map((message) => {
      const contentLength =
        typeof message.content === "string"
          ? message.content.length
          : Array.isArray(message.content)
            ? message.content.length
            : 0;
      const toolKey =
        "toolCalls" in message && Array.isArray(message.toolCalls)
          ? message.toolCalls
              .map(
                (toolCall) =>
                  `${toolCall.id}:${toolCall.function?.arguments?.length ?? 0}`,
              )
              .join(",")
          : "";
      return `${message.id}:${contentLength}:${toolKey}`;
    })
    .join("|");

  useChatScroll({
    messageCount: agent.messages.length,
    isRunning: agent.isRunning,
    contentKey,
  });
  useThreadMessages({ agent, agentId, threadId: activeThreadId });

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // activeThreadId is the only id CopilotKit / AG-UI / Mastra should see.
  useEffect(() => {
    if (activeThreadId) {
      agent.threadId = activeThreadId;
    }
  }, [agent, activeThreadId]);

  const sendPendingMessageRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  sendPendingMessageRef.current = async () => {
    if (
      !scopeKey ||
      !activeThreadId ||
      copilotkitRef.current.runtimeConnectionStatus !== "connected"
    ) {
      return;
    }

    const pendingMessage = consumePendingOutboundMessage(scopeKey);
    if (!pendingMessage) {
      return;
    }

    const currentAgent = agentRef.current;
    const currentCopilotkit = copilotkitRef.current;
    currentAgent.threadId = activeThreadId;

    currentAgent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: pendingMessage,
    });

    await runAgentSafely(
      () => currentCopilotkit.runAgent({ agent: currentAgent }),
      (error) => {
        console.error("Failed to send pending message", error);
      },
    );
  };

  useEffect(() => {
    const wasConnected = wasRuntimeConnectedRef.current;
    wasRuntimeConnectedRef.current = isRuntimeConnected;

    if (!isRuntimeConnected || wasConnected) {
      return;
    }

    sendPendingMessageRef.current?.();
  }, [isRuntimeConnected, scopeKey]);

  const suggestionBar = (
    <SuggestionBar
      suggestions={suggestions}
      agentId={agentId}
      threadId={activeThreadId ?? undefined}
    />
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a]",
        className,
      )}
    >
      <HeaderChat online={displayedOnlineStatus} onReset={resetConversation} />
      <div
        data-sidebar-chat
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          "[&_.copilotKitChat]:flex [&_.copilotKitChat]:h-full [&_.copilotKitChat]:min-h-0 [&_.copilotKitChat]:flex-col",
        )}
      >
        {isThreadLoading || isThreadError ? (
          <div className="absolute inset-0 z-10 bg-[#0a0a0a]">
            <ThreadLoadingStateView
              errorMessage={isThreadError ? loadError : null}
              onRetry={isThreadError ? requestReload : undefined}
            />
          </div>
        ) : null}
        {!activeThreadId ? (
          <ThreadLoadingStateView />
        ) : (
          <CopilotChat
            key={activeThreadId}
            agentId={agentId}
            threadId={activeThreadId}
            autoScroll="pin-to-bottom"
            className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
            // Square Stop → abort stream; drop incomplete assistant turn.
            onStop={stopGeneration}
            // The prop type merges the DOM div onError with CopilotKit's own
            // handler, so narrow to the CopilotKit payload before using it.
            onError={(event) => {
              if (!isCopilotKitError(event)) {
                return;
              }
            
              const { error, code, context } = event;
            
              if (isStopRelatedAgentError(error, code, context)) {
                return;
              }
            
              console.error(error);
            }}
            // CopilotChat always injects autoSuggestions into scrollView when the
            // chat has messages. Hide that built-in strip — we render SuggestionBar
            // once in the footer (and on the welcome screen).
            scrollView={{
              className:
                "app-scrollbar min-h-0 flex-1 [&_[data-testid=copilot-suggestions]]:hidden",
            }}
            labels={{
              chatInputPlaceholder: "Ask me anything...",
              welcomeMessageText: WELCOME_MESSAGE,
            }}
            welcomeScreen={(props) => (
              <ChatWelcomeScreen {...props} suggestionView={suggestionBar} />
            )}
            messageView={{
              className: "px-0 mx-0",
              assistantMessage:
                ChatAssistantMessage as typeof CopilotChatAssistantMessage,
              userMessage: ChatUserMessage as typeof CopilotChatUserMessage,
              cursor: ChatLoadingCursor,
            }}
            input={{
              showDisclaimer: false,
              // Footer owns the input — overlay anchoring only reserves dead space.
              bottomAnchored: false,
              className: "pointer-events-auto m-4 mt-0",
            }}
          >
            {({ scrollView, input }) => (
              <div
                data-testid="copilot-chat"
                className="copilotKitChat flex h-full min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div
                  data-chat-messages
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  {scrollView}
                  <div data-chat-bottom aria-hidden="true" className="hidden" />
                </div>
                <div
                  data-chat-footer
                  className="shrink-0 border-t border-white/5 bg-[#0a0a0a]"
                >
                  {suggestionBar}
                  {input}
                </div>
              </div>
            )}
          </CopilotChat>
        )}
      </div>
    </aside>
  );
};
