/**
 * Client Stop surface for CopilotKit v2 + Intelligence.
 *
 * Ideal AbortSignal flow (this app's mapping):
 * 1. UI Stop → stopAgent + abortRun + HTTP /stop → chat idle / no new tokens
 * 2. Runtime (AG-UI bridge) → AbortController.abort() on the Mastra run signal
 *    (not merely closing the browser socket)
 * 3. Mastra → abortSignal between steps / tools
 * 4. Tools → honor abortSignal before Nest side effects
 *
 * Owns:
 * - Stop orchestration (client stop → discard turn → HTTP /stop)
 * - Error classification (abort, STOPPED, post-Stop thread lock)
 * - Recent-stop window (Intelligence lock TTL can keep follow-up runs at 409)
 *
 * Does not own: AG-UI abortSignal injection / server latch (apps/agent/ag-ui).
 * TTL is shared with the server latch via `@repo/constants` `STOP_RECENT_TTL_MS`.
 */

import { STOP_RECENT_TTL_MS } from "@repo/constants";

type RuntimeAgentStopRequest = {
  runtimeUrl: string;
  agentId: string;
  threadId: string;
  headers?: Record<string, string>;
};

type AgentMessageLike = {
  id?: string;
  role?: string;
};

/**
 * Structural view of a CopilotKit agent. Generic over the concrete message
 * type because `setMessages` is contravariant: an agent that only accepts its
 * own message union is not assignable to one accepting `AgentMessageLike[]`.
 */
type StoppableAgent<TMessage extends AgentMessageLike> = {
  messages: TMessage[];
  setMessages: (messages: TMessage[]) => void;
};

/**
 * Silent-409 window after Stop. Same clock as the server stop latch
 * (`STOP_RECENT_TTL_MS` in `@repo/constants`).
 *
 * @deprecated Prefer `STOP_RECENT_TTL_MS` from `@repo/constants`.
 */
export const RECENT_STOP_TTL_MS = STOP_RECENT_TTL_MS;

const recentlyStoppedAtByThreadId = new Map<string, number>();

const THREAD_LOCKED_ID_RE =
  /Thread\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+is\s+locked/i;

/** Record that the user stopped this thread (call at Stop click time). */
export const markThreadRecentlyStopped = (threadId: string): void => {
  if (!threadId) {
    return;
  }

  recentlyStoppedAtByThreadId.set(threadId, Date.now());
};

/** True while post-Stop follow-up runs may still hit Intelligence 409. */
export const wasThreadRecentlyStopped = (
  threadId: string | null | undefined,
): boolean => {
  if (!threadId) {
    return false;
  }

  const stoppedAt = recentlyStoppedAtByThreadId.get(threadId);

  if (stoppedAt == null) {
    return false;
  }

  if (Date.now() - stoppedAt >= STOP_RECENT_TTL_MS) {
    recentlyStoppedAtByThreadId.delete(threadId);
    return false;
  }

  return true;
};

/** Parse thread id from `AgentThreadLockedError` message when callers omit it. */
export const threadIdFromLockedError = (
  error: unknown,
): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return error.message.match(THREAD_LOCKED_ID_RE)?.[1];
};

/** True when the error is an intentional abort (user Stop / reset). */
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException || error instanceof Error) {
    if (error.name === "AbortError") {
      return true;
    }

    return (
      error.message === "Fetch is aborted" ||
      error.message === "signal is aborted without reason" ||
      error.message === "Runner connection dropped" ||
      error.message === "Run stopped by user" ||
      error.message === "Human-in-the-loop interaction aborted"
    );
  }

  return false;
};

/** True for Intelligence RUN_ERROR events that mean Stop / runner teardown. */
export const isStopRelatedRunErrorEvent = (
  event: { code?: string; message?: string } | null | undefined,
): boolean => {
  if (!event) {
    return false;
  }

  if (event.code === "RUNNER_CONNECTION_DROPPED" || event.code === "STOPPED") {
    return true;
  }

  return (
    event.message === "Runner connection dropped" ||
    event.message === "Run stopped by user"
  );
};

/**
 * True when a CopilotKit onError payload is stop-related (not a real failure).
 * Prefer `isExpectedAgentError` at UI boundaries — that also covers post-Stop 409.
 */
export const isStopRelatedAgentError = (
  error: unknown,
  code?: string,
  context?: { runtimeErrorCode?: string } | null,
): boolean => {
  if (code === "agent_run_error_event") {
    if (
      context?.runtimeErrorCode === "RUNNER_CONNECTION_DROPPED" ||
      context?.runtimeErrorCode === "STOPPED"
    ) {
      return true;
    }
  }

  return isAbortError(error);
};

/**
 * True when the run never started because the runtime could not acquire the
 * Intelligence thread lock.
 *
 * `handleIntelligenceRun` maps every `acquireThreadLock` rejection to HTTP 409,
 * and `@copilotkit/core` turns any 409 on a run into `AgentThreadLockedError`.
 * So this covers a genuine concurrent run *and* connectivity failures to the
 * Intelligence platform (observed: UND_ERR_CONNECT_TIMEOUT after 10s). Retry is
 * the right response outside a recent Stop window — see
 * `INTELLIGENCE_THREAD_LOCK_TTL_MS` / `STOP_RECENT_TTL_MS` in `@repo/constants`.
 *
 * CopilotKit emits the same failure twice, once as `agent_thread_locked` from
 * `onRunFailed` and once as `agent_run_failed`, so match on the error name too.
 */
export const isThreadLockedAgentError = (
  error: unknown,
  code?: string,
): boolean => {
  return (
    code === "agent_thread_locked" ||
    (error instanceof Error && error.name === "AgentThreadLockedError")
  );
};

/**
 * Single UI/provider gate: Stop teardown noise + post-Stop thread-lock races.
 * Genuine concurrent-run locks (no recent Stop) return false so Retry can show.
 */
export const isExpectedAgentError = (
  error: unknown,
  code?: string,
  context?: { runtimeErrorCode?: string } | null,
  threadId?: string | null,
): boolean => {
  if (isStopRelatedAgentError(error, code, context)) {
    return true;
  }

  if (!isThreadLockedAgentError(error, code)) {
    return false;
  }

  const lockedThreadId = threadId ?? threadIdFromLockedError(error);

  return wasThreadRecentlyStopped(lockedThreadId);
};

/**
 * Stop the local CopilotRuntime / Intelligence runner for a thread.
 *
 * Needed because Intelligence-mode `agent.abortRun()` only pushes Phoenix
 * `stop_run` and returns early — it skips this HTTP stop. Without it, the
 * server keeps generating and the client reconnects ~1s later.
 */
const postRuntimeAgentStop = async ({
  runtimeUrl,
  agentId,
  threadId,
  headers,
}: RuntimeAgentStopRequest): Promise<boolean> => {
  const stopUrl = `${runtimeUrl}/agent/${encodeURIComponent(agentId)}/stop/${encodeURIComponent(threadId)}`;

  const response = await fetch(stopUrl, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Runtime stop failed: ${response.status}`);
  }

  try {
    const body = (await response.json()) as { stopped?: boolean };
    return body.stopped === true;
  } catch {
    // Non-JSON 200 — treat as best-effort success.
    return true;
  }
};

export const requestRuntimeAgentStop = async (
  request: RuntimeAgentStopRequest,
): Promise<void> => {
  // Runner registers the thread when the run Observable subscribes; a Stop
  // that races channel join can get stopped:false. Retry once briefly.
  if (await postRuntimeAgentStop(request)) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  await postRuntimeAgentStop(request);
};

/**
 * Id of the latest assistant message — the turn Stop should discard so the
 * chat is not left with a mid-stream fragment (e.g. "Check").
 */
export const getTrailingAssistantMessageId = (
  messages: AgentMessageLike[],
): string | undefined => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant" && typeof message.id === "string") {
      return message.id;
    }
  }

  return undefined;
};

/**
 * Drop the in-flight assistant message and anything after it (tool error
 * stubs from aborting HITL, partial follow-up text, etc.). Prior turns and
 * the triggering user message stay intact.
 *
 * Presentation: clears the incomplete Stop'd bubble from the chat surface.
 * Not a transcript/memory authority — durable history belongs upstream.
 */
export const discardInFlightAssistantTurn = <TMessage extends AgentMessageLike>(
  agent: StoppableAgent<TMessage>,
  assistantMessageId: string | undefined,
): void => {
  if (!assistantMessageId) {
    return;
  }

  const assistantIndex = agent.messages.findIndex(
    (message) => message.id === assistantMessageId,
  );

  if (assistantIndex < 0) {
    return;
  }

  agent.setMessages(agent.messages.slice(0, assistantIndex));
};

type StopGenerationOptions = {
  stop: () => void;
  fallbackAbort?: () => void;
  runtimeStop?: () => void | Promise<void>;
  onStopped?: () => void;
  /** Marks the recent-stop window so post-Stop 409 lock errors stay silent. */
  threadId?: string;
};

/**
 * Abort the in-flight agent run (HTTP stream + frontend tool follow-ups).
 * Conversation messages already received are preserved unless `onStopped`
 * discards the in-flight assistant turn.
 *
 * Stops the client immediately, then fires the runtime stop endpoint in
 * parallel when `runtimeStop` is provided (Intelligence skips HTTP stop in
 * `agent.abortRun`).
 */
export const stopGeneration = ({
  stop,
  fallbackAbort,
  runtimeStop,
  onStopped,
  threadId,
}: StopGenerationOptions): void => {
  if (threadId) {
    markThreadRecentlyStopped(threadId);
  }

  // Stop the client immediately so the first click clears isRunning / the
  // Stop button. Await-server-first made the UI keep streaming until a
  // second click. Server stop runs in parallel; abortSignal + takeUntilAborted
  // must end the backend run so Intelligence reconnect cannot resume it.
  try {
    stop();
  } catch (error) {
    console.error("Failed to stop generation", error);
    try {
      fallbackAbort?.();
    } catch (abortError) {
      console.error("abortRun fallback failed", abortError);
    }
  }

  try {
    onStopped?.();
  } catch (error) {
    console.error("Failed to clean up after stop", error);
  }

  if (!runtimeStop) {
    return;
  }

  void Promise.resolve(runtimeStop()).catch((error) => {
    console.error("Runtime stop request failed", error);
  });
};

/**
 * Run an agent and treat expected Stop / post-Stop lock errors as normal.
 */
export const runAgentSafely = async (
  run: () => Promise<unknown>,
  onUnexpectedError?: (error: unknown) => void,
  threadId?: string | null,
): Promise<void> => {
  try {
    await run();
  } catch (error) {
    if (isExpectedAgentError(error, undefined, undefined, threadId)) {
      return;
    }

    if (onUnexpectedError) {
      onUnexpectedError(error);
      return;
    }

    console.error("Agent run failed", error);
  }
};
