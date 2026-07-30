import { PromptInjectionDetector, UnicodeNormalizer } from "@mastra/core/processors";
import { ExcludeBlockedMessagesProcessor } from "./exclude-blocked-messages.processor";

const promptInjectionProcessor = new PromptInjectionDetector({
  model: "openai/gpt-4o-mini",
  threshold: 0.8,
  strategy: "block",
  lastMessageOnly: true,
  detectionTypes: ["injection", "jailbreak", "system-override"],
});

export const securityInputProcessor = [
  new UnicodeNormalizer({
    stripControlChars: true,
    collapseWhitespace: true,
  }),
  new ExcludeBlockedMessagesProcessor(),
  promptInjectionProcessor,
];