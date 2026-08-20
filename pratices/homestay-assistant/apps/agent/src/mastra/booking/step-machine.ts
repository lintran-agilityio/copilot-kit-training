import type { ProcessInputStepArgs, ProcessInputStepResult } from "@mastra/core/processors";
import { TOOL_KEYS } from "@repo/constants";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { parseConfirmedStay } from "@/mastra/utils/confirmed-stay";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  try { return asRecord(JSON.parse(value)); } catch { return null; }
};

type ToolResult = { toolName?: string; input?: unknown; output?: unknown };

export const resolveBookingStepTransition = ({ toolName, input, output }: ToolResult) => {
  const result = asRecord(output);
  if (!toolName || !result) return null;
  if (toolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY) {
    if (result.nextAction === TOOL_KEYS.ACTION.CONFIRM_BOOKING || result.nextAction === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING) return { type: "call" as const, toolName: String(result.nextAction) };
    if (result.nextAction === "stop_booking" || result.available !== true || result.guestsWithinCapacity !== true) return { type: "stop" as const };
    const availabilityInput = asRecord(input);
    const isModify = result.flow === "modify" || availabilityInput?.flow === "modify" || typeof availabilityInput?.excludeBookingId === "string";
    return { type: "call" as const, toolName: isModify ? TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING : TOOL_KEYS.ACTION.CONFIRM_BOOKING };
  }
  const followUps: Record<string, string> = {
    [TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING]: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
    [TOOL_KEYS.ACTION.CONFIRM_BOOKING]: TOOL_KEYS.BOOKING.CREATE_BOOKING,
    [TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING]: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
    [TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]: TOOL_KEYS.BOOKING.CANCEL,
  };
  if (followUps[toolName]) return result.confirmed === true ? { type: "call" as const, toolName: followUps[toolName]! } : { type: "stop" as const };
  if ([TOOL_KEYS.BOOKING.CREATE_BOOKING, TOOL_KEYS.BOOKING.UPDATE_BOOKING, TOOL_KEYS.BOOKING.CANCEL].includes(toolName as never)) return { type: "stop" as const };
  return null;
};

const lastStepResult = (args: ProcessInputStepArgs): ToolResult | null => (args.steps.at(-1)?.toolResults.at(-1) as ToolResult | undefined) ?? null;

const pinConfirmedStay = (args: ProcessInputStepArgs, result: ToolResult) => {
  const stay = parseConfirmedStay(result.output as never);
  if (!stay || !args.requestContext) return;
  const key = result.toolName === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING
    ? REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE
    : result.toolName === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
      ? REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY
      : REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY;
  args.requestContext.set(key, stay);
};

export const enforceBookingStep = (args: ProcessInputStepArgs): ProcessInputStepResult | undefined => {
  if (args.abortSignal?.aborted) return { activeTools: [], toolChoice: "none" };

  const result = lastStepResult(args);
  if (!result) return undefined;
  const transition = resolveBookingStepTransition(result);
  if (!transition) return undefined;
  if (transition.type === "stop") return { activeTools: [], toolChoice: "none" };
  if (!args.tools?.[transition.toolName]) return undefined;

  pinConfirmedStay(args, result);
  return {
    activeTools: [transition.toolName],
    toolChoice: { type: "tool", toolName: transition.toolName },
  };
};
