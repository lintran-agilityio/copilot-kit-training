import type { ProcessInputStepArgs } from "@mastra/core/processors";

import { getCurrentTurn } from "@repo/utils";

export type StepToolResultLike = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Normalize AI SDK / Mastra tool-result shapes:
 * - `toolName` vs `name`
 * - `output` vs `result`
 */
export const normalizeStepToolResult = (
  value: unknown,
): StepToolResultLike | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const toolName =
    asNonEmptyString(record.toolName) ?? asNonEmptyString(record.name);

  if (!toolName) {
    return null;
  }

  return {
    toolName,
    input: record.input ?? record.args,
    output: record.output ?? record.result,
  };
};

/**
 * Last tool result from `args.steps` (AI SDK StepResult.toolResults parts).
 */
export const getLastToolResultFromSteps = (
  steps: ProcessInputStepArgs["steps"] | undefined,
): StepToolResultLike | null => {
  const lastStep = steps?.at(-1);
  const lastResult = lastStep?.toolResults?.at(-1);
  return normalizeStepToolResult(lastResult);
};

type ToolInvocationLike = {
  state?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
};

/**
 * Newest completed tool-invocation in the current user turn (message parts).
 * Same source HITL transitions already trust — server tools land here after execute.
 */
export const getLastToolResultFromTurnMessages = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): StepToolResultLike | null => {
  if (!messages?.length) {
    return null;
  }

  const turn = getCurrentTurn(messages);

  for (let index = turn.length - 1; index >= 0; index -= 1) {
    const message = turn[index];

    if (message?.role === "user") {
      return null;
    }

    const parts = asRecord(message?.content)?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (let cursor = parts.length - 1; cursor >= 0; cursor -= 1) {
      const part = asRecord(parts[cursor]);
      if (part?.type !== "tool-invocation") {
        continue;
      }

      const invocation = asRecord(part.toolInvocation) as
        | ToolInvocationLike
        | null;

      if (invocation?.state !== "result" || !invocation.toolName) {
        continue;
      }

      return {
        toolName: invocation.toolName,
        input: invocation.args,
        output: invocation.result,
      };
    }
  }

  return null;
};

/**
 * Prefer steps, fall back to current-turn message parts.
 * Message fallback matters when StepResult.toolResults is empty/late but
 * MessageMerger already stored the tool-invocation on the assistant message.
 */
export const resolveLastToolResult = (
  args: Pick<ProcessInputStepArgs, "steps" | "messages">,
): StepToolResultLike | null =>
  getLastToolResultFromSteps(args.steps) ??
  getLastToolResultFromTurnMessages(args.messages);

/**
 * How many completed invocations of `toolName` exist in the current turn.
 * Used to detect self-loops even when "last tool" shape is ambiguous.
 */
export const countToolResultsInCurrentTurn = (
  messages: ProcessInputStepArgs["messages"] | undefined,
  toolName: string,
): number => {
  if (!messages?.length) {
    return 0;
  }

  let count = 0;
  const turn = getCurrentTurn(messages);

  for (const message of turn) {
    if (message?.role === "user") {
      continue;
    }

    const parts = asRecord(message?.content)?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (const part of parts) {
      const record = asRecord(part);
      if (record?.type !== "tool-invocation") {
        continue;
      }
      const invocation = asRecord(record.toolInvocation);
      if (
        invocation?.state === "result" &&
        invocation.toolName === toolName
      ) {
        count += 1;
      }
    }
  }

  return count;
};
