/**
 * Presentation helpers for security-blocked turns.
 *
 * Policy lives in `@repo/utils`. Do not mutate `agent.messages` to stamp
 * blocked metadata — derive UI state at render. Durable blocked ids belong
 * in AG-UI/Mastra (`stream-patch` + thread metadata).
 */

import {
  getProcessorBlockAssistantDisplayText,
  isProcessorBlockAssistantContent,
} from "@repo/constants";

export { isUserMessageBlockedInTranscript } from "@repo/utils";

/** Strip the durable `@@processor-block@@` marker for assistant bubble text. */
export const getAssistantDisplayContent = (content: unknown): string => {
  if (!isProcessorBlockAssistantContent(content)) {
    return typeof content === "string" ? content : "";
  }

  return getProcessorBlockAssistantDisplayText(String(content));
};
