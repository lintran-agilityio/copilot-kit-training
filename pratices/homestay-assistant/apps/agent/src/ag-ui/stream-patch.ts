import { AsyncLocalStorage } from "node:async_hooks";

import type { RequestContext } from "@mastra/core/request-context";
import {
  AGENT_STEP_LIMIT_PROCESSOR_ID,
  THREAD_METADATA_BLOCKED_MESSAGE_IDS,
  formatProcessorBlockAssistantContent,
  isBlockedMessageMetadata,
} from "@repo/constants";

import { loadBlockedMessageIdsForThread } from "@/mastra/processors/blocked-message-ids";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { loadResolvedToolCallIdsForThread } from "@/mastra/utils";
import {
  clearStopLatch,
  getStopLatch,
  isStopLatchLive,
  latchThreadStop,
  noteThreadUserMessage,
} from "./stop-latch";

type AgUiToolCall = {
  id?: string;
};

type AgUiMessage = {
  id?: string;
  role?: string;
  metadata?: unknown;
  content?: unknown;
  toolCalls?: AgUiToolCall[];
  toolCallId?: string;
};

type MastraAgentLike = {
  getMemory?: (args: {
    requestContext?: RequestContext;
  }) => Promise<{
    getThreadById?: (args: { threadId: string }) => Promise<{
      title?: string;
      metadata?: Record<string, unknown>;
    } | null>;
    updateThread?: (args: {
      id: string;
      title: string;
      metadata: Record<string, unknown>;
    }) => Promise<unknown>;
  } | null>;
  stream?: (
    messages: unknown,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
  abortRunStream?: (runId: string) => boolean;
};

type AgUiRunInput = {
  runId?: string;
  threadId?: string;
  [key: string]: unknown;
};

type AgUiMastraAgent = {
  resourceId?: string;
  requestContext?: RequestContext;
  agent?: MastraAgentLike | null;
  processFullStream?: (
    stream: AsyncIterable<unknown>,
    callbacks: Record<string, unknown>,
    excludedToolNames?: Set<string>,
    workingMemoryState?: Record<string, unknown>,
  ) => Promise<boolean>;
  streamMastraAgent?: (
    input: {
      threadId: string;
      messages: AgUiMessage[];
    },
    callbacks: Record<string, unknown>,
  ) => Promise<unknown>;
  clone?: () => AgUiMastraAgent;
  run?: (input: AgUiRunInput) => unknown;
  /**
   * AbstractAgent.abortRun is a no-op; Intelligence runner stop relies on it.
   * We override it to abort the Mastra stream via abortSignal (not detachActiveRun,
   * which drops the Phoenix runner socket and surfaces RUNNER_CONNECTION_DROPPED).
   */
  abortRun?: () => void;
};

type MastraStreamChunk = {
  type?: string;
  payload?: {
    reason?: string;
    processorId?: string;
  };
};

const patchedAgents = new WeakSet<object>();
const streamPatchedMastraAgents = new WeakSet<object>();

/** Per CopilotKit/Intelligence runId — abortSignal injected into Mastra stream(). */
const abortControllersByRunId = new Map<string, AbortController>();

/**
 * Maps threadId → live runIds so abortRun can cancel every in-flight controller
 * for a thread, even when Intelligence calls abort on a clone whose
 * `activeRunId` is stale or empty (first-click Stop miss).
 */
const runIdsByThreadId = new Map<string, Set<string>>();

const registerRunAbortController = (
  threadId: string | undefined,
  runId: string,
  controller: AbortController,
) => {
  abortControllersByRunId.set(runId, controller);

  if (!threadId) {
    return;
  }

  const runIds = runIdsByThreadId.get(threadId) ?? new Set<string>();
  runIds.add(runId);
  runIdsByThreadId.set(threadId, runIds);
};

const unregisterRunAbortController = (
  threadId: string | undefined,
  runId: string,
) => {
  abortControllersByRunId.delete(runId);

  if (!threadId) {
    return;
  }

  const runIds = runIdsByThreadId.get(threadId);

  if (!runIds) {
    return;
  }

  runIds.delete(runId);

  if (runIds.size === 0) {
    runIdsByThreadId.delete(threadId);
  }
};

const abortControllersForThread = (
  threadId: string | undefined,
  preferredRunId?: string,
): { runIds: string[]; controllers: AbortController[] } => {
  const runIds = new Set<string>();

  if (preferredRunId) {
    runIds.add(preferredRunId);
  }

  if (threadId) {
    for (const runId of runIdsByThreadId.get(threadId) ?? []) {
      runIds.add(runId);
    }
  }

  const controllers: AbortController[] = [];

  for (const runId of runIds) {
    const controller = abortControllersByRunId.get(runId);

    if (controller) {
      controllers.push(controller);
    }
  }

  return { runIds: [...runIds], controllers };
};

const trailingUserMessageId = (messages: AgUiMessage[]): string | undefined => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && typeof message.id === "string") {
      return message.id;
    }
  }

  return undefined;
};

const isAbortLikeError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "AbortError" ||
    error.message === "Fetch is aborted" ||
    error.message === "signal is aborted without reason" ||
    /aborted/i.test(error.message)
  );
};

/**
 * Stop forwarding chunks as soon as `signal` aborts — do not wait for the
 * next LLM token. A plain `for await` only checks aborted after each chunk,
 * so Stop appeared to do nothing until another token arrived (often a
 * second click).
 */
async function* takeUntilAborted(
  stream: AsyncIterable<unknown>,
  signal: AbortSignal | undefined,
) {
  if (signal?.aborted) {
    return;
  }

  const iterator = stream[Symbol.asyncIterator]();
  let abortListener: (() => void) | undefined;
  const abortPromise =
    signal == null
      ? null
      : new Promise<"aborted">((resolve) => {
          if (signal.aborted) {
            resolve("aborted");
            return;
          }

          abortListener = () => resolve("aborted");
          signal.addEventListener("abort", abortListener, { once: true });
        });

  try {
    while (true) {
      const nextPromise = iterator.next();
      const raced =
        abortPromise == null
          ? { kind: "next" as const, result: await nextPromise }
          : await Promise.race([
              nextPromise.then((result) => ({
                kind: "next" as const,
                result,
              })),
              abortPromise.then((kind) => ({ kind })),
            ]);

      if (raced.kind === "aborted") {
        try {
          await iterator.return?.();
        } catch {
          // Best-effort close of the underlying Mastra stream.
        }
        return;
      }

      if (raced.result.done) {
        return;
      }

      yield raced.result.value;
    }
  } catch (error) {
    if (signal?.aborted || isAbortLikeError(error)) {
      return;
    }

    throw error;
  } finally {
    if (signal && abortListener) {
      signal.removeEventListener("abort", abortListener);
    }
  }
}

/**
 * Shared LocalMastraAgent instances are reused across AG-UI clones. Inject
 * abortSignal from the per-runId map so concurrent threads do not share one
 * controller.
 */
const ensureMastraStreamAbortInjection = (
  mastraAgent: MastraAgentLike | null | undefined,
) => {
  if (!mastraAgent?.stream || streamPatchedMastraAgents.has(mastraAgent)) {
    return;
  }

  streamPatchedMastraAgents.add(mastraAgent);

  const originalStream = mastraAgent.stream.bind(mastraAgent);

  mastraAgent.stream = (messages, options = {}) => {
    const runId = typeof options.runId === "string" ? options.runId : undefined;
    const controller = runId
      ? abortControllersByRunId.get(runId)
      : undefined;

    return originalStream(messages, {
      ...options,
      ...(controller ? { abortSignal: controller.signal } : {}),
    });
  };
};

export const isBlockedUserMessage = (message: AgUiMessage) =>
  message.role === "user" && isBlockedMessageMetadata(message.metadata);

export const excludeBlockedUserMessages = <T extends AgUiMessage>(
  messages: T[],
): T[] => messages.filter((message) => !isBlockedUserMessage(message));

/**
 * Mastra memory owns completed turns. Send only the latest user turn from the
 * AG-UI transcript so browser-side message ids from older turns cannot be
 * mistaken for new messages. Messages after that user message are retained for
 * frontend-tool continuations that run without adding another user message.
 */
export const selectLatestUserTurn = <T extends AgUiMessage>(
  messages: T[],
): T[] => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages.slice(index);
    }
  }

  return messages;
};

const hasText = (content: unknown) =>
  typeof content === "string" ? content.trim().length > 0 : content != null;

/**
 * The AG-UI transcript replays the assistant tool calls of the turn in flight
 * on every frontend-tool continuation. Mastra merges those replayed calls into
 * the turn's stored assistant message, so a tool call memory already resolved
 * gets written again and comes back duplicated on later recalls. Forward only
 * the calls memory does not own yet; the tool result of a resolved call is
 * dropped with it so no result is left orphaned.
 */
export const excludeResolvedToolCalls = <T extends AgUiMessage>(
  messages: T[],
  resolvedToolCallIds: ReadonlySet<string>,
): T[] => {
  if (resolvedToolCallIds.size === 0) {
    return messages;
  }

  const filtered: T[] = [];

  for (const message of messages) {
    if (message.role === "tool") {
      if (message.toolCallId && resolvedToolCallIds.has(message.toolCallId)) {
        continue;
      }

      filtered.push(message);
      continue;
    }

    if (message.role !== "assistant" || !message.toolCalls?.length) {
      filtered.push(message);
      continue;
    }

    const toolCalls = message.toolCalls.filter(
      (toolCall) => !toolCall.id || !resolvedToolCallIds.has(toolCall.id),
    );

    if (toolCalls.length === message.toolCalls.length) {
      filtered.push(message);
      continue;
    }

    if (toolCalls.length === 0 && !hasText(message.content)) {
      continue;
    }

    filtered.push({ ...message, toolCalls });
  }

  return filtered;
};

const findLatestUnblockedUserMessageId = (messages: AgUiMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      message?.role === "user" &&
      typeof message.id === "string" &&
      !isBlockedUserMessage(message)
    ) {
      return message.id;
    }
  }

  return undefined;
};

async function syncBlockedMessageIdsToRequestContext({
  requestContext,
  blockedMessageIds,
}: {
  requestContext?: RequestContext;
  blockedMessageIds: string[];
}) {
  if (!requestContext) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.BLOCKED_MESSAGE_IDS,
    blockedMessageIds,
  );
}

async function resolveBlockedMessageIds({
  mastraAgent,
  threadId,
  requestContext,
  messages,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  requestContext?: RequestContext;
  messages: AgUiMessage[];
}) {
  const blockedMessageIds = new Set(
    await loadBlockedMessageIdsForThread({
      mastraAgent,
      threadId,
      requestContext,
    }),
  );

  for (const message of messages) {
    if (isBlockedUserMessage(message) && typeof message.id === "string") {
      blockedMessageIds.add(message.id);
    }
  }

  return [...blockedMessageIds];
}

const persistBlockedMessageId = async ({
  mastraAgent,
  threadId,
  messageId,
  requestContext,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  messageId: string;
  requestContext?: RequestContext;
}) => {
  if (!mastraAgent?.getMemory) {
    return;
  }

  try {
    const memory = await mastraAgent.getMemory({ requestContext });

    if (!memory?.getThreadById || !memory.updateThread) {
      return;
    }

    const thread = await memory.getThreadById({ threadId });
    const metadata = { ...(thread?.metadata ?? {}) };
    const existing = metadata[THREAD_METADATA_BLOCKED_MESSAGE_IDS];
    const blockedMessageIds = Array.isArray(existing)
      ? existing.filter((value): value is string => typeof value === "string")
      : [];

    if (blockedMessageIds.includes(messageId)) {
      return;
    }

    await memory.updateThread({
      id: threadId,
      title: typeof thread?.title === "string" ? thread.title : "",
      metadata: {
        ...metadata,
        [THREAD_METADATA_BLOCKED_MESSAGE_IDS]: [...blockedMessageIds, messageId],
      },
    });
  } catch (error) {
    console.warn(
      `[ProcessorTripwire] Failed to persist blocked message ${messageId} for thread ${threadId}:`,
      error,
    );
  }
}

async function* interceptTripwireStream(
  stream: AsyncIterable<unknown>,
  onTripwire: (chunk: MastraStreamChunk) => Promise<void>,
) {
  for await (const chunk of stream) {
    const typedChunk = chunk as MastraStreamChunk;

    if (typedChunk?.type === "tripwire") {
      if (typedChunk.payload?.processorId === AGENT_STEP_LIMIT_PROCESSOR_ID) {
        yield chunk;
        continue;
      }

      await onTripwire(typedChunk);
      return;
    }

    yield chunk;
  }
}

/**
 * Installs stop/abort wiring, transcript filters, and tripwire interception
 * on one agent.
 *
 * Stop contract (AbortSignal):
 * - `run()` creates an AbortController per Intelligence runId and registers it
 *   by thread so abortRun can cancel every in-flight controller.
 * - `ensureMastraStreamAbortInjection` passes that signal into Mastra `stream()`.
 * - Mastra then checks the signal between steps and forwards it to tools.
 * - `abortRun` + stop latch abort the signal without detachActiveRun (which
 *   would drop the Phoenix socket and surface RUNNER_CONNECTION_DROPPED).
 *
 * These are instance-level overrides, and CopilotKit's run/connect handlers
 * call `agent.clone()` per request. `MastraAgent.clone()` rebuilds the instance
 * from its config, so it keeps none of them — leaving every request on the
 * unpatched methods. Re-applying on each clone is what actually puts these
 * filters on the request path.
 */
const patchAgUiAgent = (aguiAgent: AgUiMastraAgent) => {
  if (patchedAgents.has(aguiAgent)) {
    return;
  }

  patchedAgents.add(aguiAgent);

  const originalClone = aguiAgent.clone?.bind(aguiAgent);
  const originalAbortRun = aguiAgent.abortRun?.bind(aguiAgent);
  const originalRun = aguiAgent.run?.bind(aguiAgent);
  let activeRunId: string | undefined;
  let activeThreadId: string | undefined;
  let activeUserMessageId: string | undefined;

  ensureMastraStreamAbortInjection(aguiAgent.agent);

  if (originalClone) {
    aguiAgent.clone = () => {
      const cloned = originalClone();
      patchAgUiAgent(cloned);

      return cloned;
    };
  } else {
    console.warn(
      "[ProcessorTripwire] MastraAgent has no clone(); per-request agent clones may bypass transcript filtering.",
    );
  }

  if (originalRun) {
    aguiAgent.run = (input) => {
      const runId =
        typeof input.runId === "string" && input.runId.length > 0
          ? input.runId
          : undefined;
      const threadId =
        typeof input.threadId === "string" ? input.threadId : undefined;
      const messages = Array.isArray(input.messages)
        ? (input.messages as AgUiMessage[])
        : [];

      if (activeRunId && activeRunId !== runId) {
        unregisterRunAbortController(activeThreadId, activeRunId);
      }

      activeRunId = runId;
      activeThreadId = threadId;
      activeUserMessageId = trailingUserMessageId(messages);

      if (threadId && activeUserMessageId) {
        noteThreadUserMessage(threadId, activeUserMessageId);
      }

      const controller = new AbortController();

      if (runId) {
        registerRunAbortController(threadId, runId, controller);
      }

      // A run starting while the thread is latched is part of the chain the
      // user just stopped — unless it is an explicit new user action (new user
      // message, or a HITL resume). Abort before the model streams anything.
      // FE-tool continuations keep the same trailing user message id, so they
      // stay blocked while the latch is live (do not treat them as a new turn).
      const latch = threadId ? getStopLatch(threadId) : undefined;
      const isLatchLive = isStopLatchLive(latch);
      const isResume =
        (Array.isArray(input.resume) && input.resume.length > 0) ||
        !!(input.forwardedProps as { command?: unknown } | undefined)?.command;
      const isNewUserTurn =
        !!activeUserMessageId &&
        activeUserMessageId !== latch?.stoppedUserMessageId;
      const blockedByStop = isLatchLive && !isResume && !isNewUserTurn;

      // An expired latch, a resume, or a new user turn all release the thread.
      if (threadId && !blockedByStop) {
        clearStopLatch(threadId);
      }

      if (blockedByStop) {
        controller.abort();
      }

      // Bound map growth if clones are discarded without abort/complete.
      if (abortControllersByRunId.size > 64) {
        const oldest = abortControllersByRunId.keys().next().value;
        if (oldest && oldest !== runId) {
          let oldestThreadId: string | undefined;
          for (const [mappedThreadId, runIds] of runIdsByThreadId) {
            if (runIds.has(oldest)) {
              oldestThreadId = mappedThreadId;
              break;
            }
          }
          unregisterRunAbortController(oldestThreadId, oldest);
        }
      }

      return originalRun(input);
    };
  }

  // CopilotKit Intelligence `runner.stop()` calls `agent.abortRun()`.
  // Abort the Mastra stream via abortSignal so the runner can finalize with
  // stopRequested. Do NOT call detachActiveRun — that leaves the Phoenix
  // ingestion socket (`{:shutdown, :left}`) and the gateway emits
  // RUNNER_CONNECTION_DROPPED as a user-facing agent error.
  aguiAgent.abortRun = () => {
    const runId = activeRunId;
    const threadId = activeThreadId;

    // Latch the thread so the follow-up run the client starts right after this
    // abort does not keep the generation alive (the reason Stop needed a
    // second click).
    if (threadId) {
      latchThreadStop(threadId);
    }

    // Abort every live controller for this thread — not only this clone's
    // activeRunId. Intelligence may call abort on a clone that never saw run().
    const { runIds, controllers } = abortControllersForThread(threadId, runId);

    for (const controller of controllers) {
      controller.abort();
    }

    try {
      if (typeof aguiAgent.agent?.abortRunStream === "function") {
        for (const id of runIds) {
          aguiAgent.agent.abortRunStream(id);
        }
      }
    } catch (error) {
      console.error(
        "[ProcessorTripwire] abortRunStream failed during abortRun",
        error,
      );
    }

    try {
      originalAbortRun?.();
    } catch (error) {
      console.error("[ProcessorTripwire] original abortRun failed", error);
    }
  };

  if (!aguiAgent.streamMastraAgent || !aguiAgent.processFullStream) {
    // Loud on purpose: these hooks are internals of @ag-ui/mastra. If a version
    // bump renames them, the transcript filters stop running and history
    // silently duplicates instead of failing.
    console.warn(
      "[ProcessorTripwire] MastraAgent is missing streamMastraAgent/processFullStream; transcript filtering and tripwire handling are disabled.",
    );

    return;
  }

  const originalProcessFullStream = aguiAgent.processFullStream.bind(aguiAgent);
  const originalStreamMastraAgent = aguiAgent.streamMastraAgent.bind(aguiAgent);

  aguiAgent.processFullStream = async (stream, callbacks, ...rest) => {
    const runId = activeRunId;
    const signal = runId
      ? abortControllersByRunId.get(runId)?.signal
      : undefined;

    let effectiveStream: AsyncIterable<unknown> = takeUntilAborted(
      stream,
      signal,
    );

    const tripwireContext = tripwireHandlingContext.getStore();

    if (tripwireContext) {
      effectiveStream = interceptTripwireStream(
        effectiveStream,
        async (chunk) => {
          const onTextPart = callbacks.onTextPart as
            | ((text: string) => void)
            | undefined;
          const onFinishMessagePart = callbacks.onFinishMessagePart as
            | (() => void)
            | undefined;

          onTextPart?.(formatProcessorBlockAssistantContent());
          onFinishMessagePart?.();

          if (tripwireContext.blockedUserMessageId) {
            await persistBlockedMessageId({
              mastraAgent: aguiAgent.agent,
              threadId: tripwireContext.threadId,
              messageId: tripwireContext.blockedUserMessageId,
              requestContext: aguiAgent.requestContext,
            });

            const currentBlocked = aguiAgent.requestContext?.get(
              REQUEST_CONTEXT_KEYS.BLOCKED_MESSAGE_IDS,
            );
            const blockedSet = new Set<string>(
              Array.isArray(currentBlocked)
                ? currentBlocked.filter(
                    (value): value is string => typeof value === "string",
                  )
                : [],
            );
            blockedSet.add(tripwireContext.blockedUserMessageId);
            await syncBlockedMessageIdsToRequestContext({
              requestContext: aguiAgent.requestContext,
              blockedMessageIds: [...blockedSet],
            });
          }

          if (chunk.payload?.reason) {
            console.info(
              `[ProcessorTripwire] Blocked message ${tripwireContext.blockedUserMessageId ?? "unknown"}: ${chunk.payload.reason}`,
            );
          }
        },
      );
    }

    try {
      return await originalProcessFullStream(
        effectiveStream,
        callbacks,
        ...rest,
      );
    } catch (error) {
      if (signal?.aborted || isAbortLikeError(error)) {
        return false;
      }

      throw error;
    }
    // AbortController lifetime is owned by run() — do not delete here.
    // Multi-step / tool loops can call processFullStream more than once per
    // runId; deleting early made later abortRun() a no-op (needed 2nd Stop).
  };

  aguiAgent.streamMastraAgent = async (input, callbacks) => {
    const blockedMessageIds = await resolveBlockedMessageIds({
      mastraAgent: aguiAgent.agent,
      threadId: input.threadId,
      requestContext: aguiAgent.requestContext,
      messages: input.messages,
    });

    await syncBlockedMessageIdsToRequestContext({
      requestContext: aguiAgent.requestContext,
      blockedMessageIds,
    });

    const blockedUserMessageId = findLatestUnblockedUserMessageId(
      input.messages,
    );
    const unblockedMessages = excludeBlockedUserMessages(input.messages);
    const latestTurn = selectLatestUserTurn(unblockedMessages);
    const resolvedToolCallIds = await loadResolvedToolCallIdsForThread({
      mastraAgent: aguiAgent.agent,
      threadId: input.threadId,
      resourceId: aguiAgent.resourceId,
      requestContext: aguiAgent.requestContext,
    });

    return tripwireHandlingContext.run(
      {
        threadId: input.threadId,
        blockedUserMessageId,
      },
      () =>
        originalStreamMastraAgent(
          {
            ...input,
            messages: excludeResolvedToolCalls(latestTurn, resolvedToolCallIds),
          },
          callbacks,
        ),
    );
  };
};

export const enableProcessorTripwireHandling = <
  T extends Record<string, object>,
>(
  agents: T,
): T => {
  for (const value of Object.values(agents)) {
    patchAgUiAgent(value as AgUiMastraAgent);
  }

  return agents;
};

type TripwireHandlingContext = {
  threadId: string;
  blockedUserMessageId?: string;
};

const tripwireHandlingContext =
  new AsyncLocalStorage<TripwireHandlingContext>();
