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

/** True when the error is an intentional abort (user Stop / reset). */
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException || error instanceof Error) {
    if (error.name === "AbortError") {
      return true;
    }

    return (
      error.message === "Fetch is aborted" ||
      error.message === "signal is aborted without reason"
    );
  }

  return false;
};

/**
 * Stop the local CopilotRuntime / Intelligence runner for a thread.
 *
 * Needed because Intelligence-mode `agent.abortRun()` only pushes Phoenix
 * `stop_run` and returns early — it skips this HTTP stop. Without it, the
 * server keeps generating and the client reconnects ~1s later.
 */
export const requestRuntimeAgentStop = async ({
  runtimeUrl,
  agentId,
  threadId,
  headers,
}: RuntimeAgentStopRequest): Promise<void> => {
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
};

/**
 * Abort the in-flight agent run (HTTP stream + frontend tool follow-ups).
 * Conversation messages already received are preserved.
 *
 * Always pairs client `stopAgent` with the runtime stop endpoint when
 * `runtimeStop` is provided (Intelligence skips that path in abortRun).
 *
 * @example
 * stopGeneration(
 *   () => copilotkit.stopAgent({ agent }),
 *   () => agent.abortRun(),
 *   () => requestRuntimeAgentStop({ ... }),
 * );
 */
export const stopGeneration = (
  stop: () => void,
  fallbackAbort?: () => void,
  runtimeStop?: () => void | Promise<void>,
): void => {
  // Kill the server runner first so Intelligence run-activity reconnect
  // cannot resume a still-running backend generation.
  if (runtimeStop) {
    try {
      void Promise.resolve(runtimeStop()).catch((error) => {
        console.error("Runtime stop request failed", error);
      });
    } catch (error) {
      console.error("Runtime stop request failed", error);
    }
  }

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
