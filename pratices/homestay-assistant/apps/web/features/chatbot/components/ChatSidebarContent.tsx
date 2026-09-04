"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatInput,
  CopilotChatReasoningMessage,
  CopilotChatUserMessage,
  CopilotKitCoreErrorCode,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";

import { cn } from "@repo/utils";
import { MESSAGE_ROLE } from "@repo/constants";
import {
  RUN_START_FAILED_MESSAGE,
  WELCOME_MESSAGE,
} from "@/features/chatbot/constants";
import {
  useChatSuggestions,
  useChatScroll,
  useResetConversation,
  useSilenceStopRunErrors,
  useStopGeneration,
  useThreadMessages,
} from "@/features/chatbot/hooks";
import {
  HeaderChat,
  ChatUserMessage,
  ChatWelcomeScreen,
  ChatAssistantMessage,
  ChatReasoningMessage,
  ChatLoadingCursor,
  ChatRunErrorNotice,
} from "@/features/chatbot/components";
import { ChatInput } from "@/features/chatbot/components/ChatInput";
import { useChatStore } from "@/features/chatbot/stores/chat-store";
import { ChatSidebarProps } from "@/features/chatbot/components/ChatSidebar";
import {
  isExpectedAgentError,
  isRateLimitAgentError,
  isThreadLockedAgentError,
  rejectIfAgentRunning,
  runAgentSafely,
} from "@/features/chatbot/utils";
import { SuggestionBar } from "@/features/chatbot/components/suggestions";
import { ThreadLoadingStateView } from "@/features/chatbot/threads/components";
import { useChatSession } from "@/features/chatbot/threads/hooks/useChatSession";
import { generateId } from "@/utils";

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
  const actionError = useChatStore((state) => state.actionError);
  const actionErrorRetriable = useChatStore(
    (state) => state.actionErrorRetriable,
  );
  const clearActionError = useChatStore((state) => state.clearActionError);
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId });
  const [hasHydrated, setHasHydrated] = useState(false);
  const [runStartError, setRunStartError] = useState<string | null>(null);
  const [isRetryingRun, setIsRetryingRun] = useState(false);
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

    const currentAgent = agentRef.current;
    // Keep the queued message until the in-flight run finishes — this is a
    // reconnect flush, not a guest send while busy.
    if (currentAgent.isRunning) {
      return;
    }

    const pendingMessage = consumePendingOutboundMessage(scopeKey);
    if (!pendingMessage) {
      return;
    }

    const currentCopilotkit = copilotkitRef.current;
    currentAgent.threadId = activeThreadId;

    currentAgent.addMessage({
      id: generateId(),
      role: MESSAGE_ROLE.USER,
      content: pendingMessage,
    });

    await runAgentSafely(
      () => currentCopilotkit.runAgent({ agent: currentAgent }),
      (error) => {
        console.error("Failed to send pending message", error);
      },
      activeThreadId,
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

  useEffect(() => {
    if (!isRuntimeConnected || agent.isRunning) {
      return;
    }

    sendPendingMessageRef.current?.();
  }, [agent.isRunning, isRuntimeConnected, scopeKey]);

  // A started run (or a thread switch) makes a previous start failure stale.
  useEffect(() => {
    if (agent.isRunning) {
      setRunStartError(null);
    }
  }, [agent.isRunning]);

  useEffect(() => {
    setRunStartError(null);
    clearActionError();
  }, [activeThreadId, clearActionError]);

  // The failed run never reached the agent, so the triggering user message is
  // still the last message in the thread — re-running is enough to retry it.
  const retryRun = useCallback(async () => {
    if (rejectIfAgentRunning(agentRef.current.isRunning)) {
      return;
    }

    setIsRetryingRun(true);
    setRunStartError(null);
    useChatStore.getState().clearActionError();

    await runAgentSafely(
      () => copilotkitRef.current.runAgent({ agent: agentRef.current }),
      (error) => {
        setRunStartError(RUN_START_FAILED_MESSAGE);
        console.error("Failed to retry agent run", error);
      },
      agentRef.current.threadId,
    );

    setIsRetryingRun(false);
  }, []);

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
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
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
          <div className="absolute inset-0 z-10 bg-card">
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

              // Stop teardown + post-Stop Intelligence 409 — not user failures.
              if (isExpectedAgentError(error, code, context, activeThreadId)) {
                return;
              }

              // Lock acquisition failed outside a Stop window — offer retry.
              if (isThreadLockedAgentError(error, code)) {
                setRunStartError(RUN_START_FAILED_MESSAGE);
                return;
              }

              // Model-provider rate limit (e.g. Cerebras tokens-per-minute) is
              // owned by `handleCopilotError` → chat-store `actionError`, which
              // renders the retriable footer notice. Don't also log it as a
              // failure here.
              if (isRateLimitAgentError(error, context)) {
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
              // Hide the "Thinking…" / "Thought for a few seconds" disclosure
              // that every provider (OpenAI / OpenRouter / Cerebras) emits.
              reasoningMessage:
                ChatReasoningMessage as unknown as typeof CopilotChatReasoningMessage,
              cursor: ChatLoadingCursor,
            }}
            input={ChatInput as typeof CopilotChatInput}
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
                  className="shrink-0 border-t border-border bg-card pt-3"
                >
                  {runStartError ? (
                    <ChatRunErrorNotice
                      message={runStartError}
                      isRetrying={isRetryingRun}
                      onRetry={retryRun}
                      onDismiss={() => setRunStartError(null)}
                    />
                  ) : actionError ? (
                    <ChatRunErrorNotice
                      message={actionError}
                      isRetrying={isRetryingRun}
                      onRetry={actionErrorRetriable ? retryRun : undefined}
                      onDismiss={clearActionError}
                    />
                  ) : null}
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
