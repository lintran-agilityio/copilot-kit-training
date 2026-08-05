/**
 * Abort / stop helpers for CopilotKit agent runs.
 *
 * Stop is expected behavior — never surface AbortError as a user-facing failure.
 */

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

type StoppableAgent = {
  messages: AgentMessageLike[];
  setMessages: (messages: AgentMessageLike[]) => void;
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

/** True when a CopilotKit onError payload is stop-related (not a real failure). */
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
    // TEMP: remove once first-click Stop is confirmed fixed.
    console.info("[StopDebug] POST /stop response", {
      threadId,
      status: response.status,
      stopped: body.stopped,
    });
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

  await new Promise((resolve) => setTimeout(resolve, 150));
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
 */
export const discardInFlightAssistantTurn = (
  agent: StoppableAgent,
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

/**
 * Abort the in-flight agent run (HTTP stream + frontend tool follow-ups).
 * Conversation messages already received are preserved unless `onStopped`
 * discards the in-flight assistant turn.
 *
 * Stops the client immediately, then fires the runtime stop endpoint in
 * parallel when `runtimeStop` is provided (Intelligence skips HTTP stop in
 * `agent.abortRun`).
 *
 * @example
 * stopGeneration(
 *   () => copilotkit.stopAgent({ agent }),
 *   () => agent.abortRun(),
 *   () => requestRuntimeAgentStop({ ... }),
 *   () => discardInFlightAssistantTurn(agent, assistantId),
 * );
 */
export const stopGeneration = (
  stop: () => void,
  fallbackAbort?: () => void,
  runtimeStop?: () => void | Promise<void>,
  onStopped?: () => void,
): void => {
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
 * Run an agent and treat AbortError as a normal stop (no error logging/toast).
 *
 * @example
 * await runAgentSafely(
 *   () => copilotkit.runAgent({ agent }),
 *   (error) => console.error("Failed", error),
 * );
 */
export const runAgentSafely = async (
  run: () => Promise<unknown>,
  onUnexpectedError?: (error: unknown) => void,
): Promise<void> => {
  try {
    await run();
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }

    if (onUnexpectedError) {
      onUnexpectedError(error);
      return;
    }

    console.error("Agent run failed", error);
  }
};
