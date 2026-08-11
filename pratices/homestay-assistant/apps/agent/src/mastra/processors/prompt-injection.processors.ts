import {
  PromptInjectionDetector,
  UnicodeNormalizer,
} from "@mastra/core/processors";

import { AGENT_INPUT_TOKEN_LIMIT } from "@repo/constants";
import { DedupeToolCallsProcessor } from "./dedupe-tool-calls.processor";
import { ExcludeBlockedMessagesProcessor } from "./exclude-blocked-messages.processor";
import { TokenLimiterWithDiagnosticsProcessor } from "./token-limiter-diagnostics.processor";
import { UserMessageTokenLimitProcessor } from "./user-message-token-limit.processor";

const promptInjectionProcessor = new PromptInjectionDetector({
  model: process.env.AI_MODEL || "openai/gpt-4o-mini",
  threshold: 0.8,
  strategy: "block",
  lastMessageOnly: true,
  detectionTypes: ["injection", "jailbreak", "system-override"],
});

/** Same limit/trimMode as before — diagnostics wrapper only logs on TripWire. */
const tokenLimitProcessor = new TokenLimiterWithDiagnosticsProcessor({
  limit: AGENT_INPUT_TOKEN_LIMIT,
  trimMode: "contiguous",
});
/** Unicode → blocked-history filter → prompt injection → request size → context window → prompt dedupe */
export const securityInputProcessor = [
  new UnicodeNormalizer({
    stripControlChars: true,
    collapseWhitespace: true,
  }),
  new ExcludeBlockedMessagesProcessor(),
  promptInjectionProcessor,
  new UserMessageTokenLimitProcessor(),
  tokenLimitProcessor,
  new DedupeToolCallsProcessor(),
];
