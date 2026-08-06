/**
 * Abort helpers for the CopilotKit → AG-UI → Mastra Stop path.
 *
 * Runtime injects `abortSignal` into `agent.stream()`; Mastra forwards it to
 * prepareStep / tool `execute` context. Tools and HTTP must honor it so Stop
 * does not commit side effects after the user cancels.
 */

import type { RequestContext } from "@mastra/core/request-context";
import { RUN_STOPPED_BY_USER_MESSAGE } from "@repo/utils";

export const isAbortSignalAborted = (
  signal: AbortSignal | null | undefined,
): boolean => Boolean(signal?.aborted);

/** Throw a standard AbortError when the run was stopped. */
export const throwIfAborted = (
  signal: AbortSignal | null | undefined,
  message: string = RUN_STOPPED_BY_USER_MESSAGE,
): void => {
  if (!isAbortSignalAborted(signal)) {
    return;
  }

  const error = new Error(message);
  error.name = "AbortError";
  throw error;
};

/** Build Nest API service context from a Mastra tool execution context. */
export const serviceContextFromTool = (context: {
  requestContext?: RequestContext;
  abortSignal?: AbortSignal;
}) => ({
  requestContext: context.requestContext,
  abortSignal: context.abortSignal,
});
