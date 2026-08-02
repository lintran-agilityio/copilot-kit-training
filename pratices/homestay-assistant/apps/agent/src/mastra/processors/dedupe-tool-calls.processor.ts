import type {
  ProcessLLMRequestArgs,
  ProcessLLMRequestResult,
  Processor,
} from "@mastra/core/processors";

type LlmPrompt = ProcessLLMRequestArgs["prompt"];
type LlmMessage = LlmPrompt[number];
type AssistantPart = Extract<LlmMessage, { role: "assistant" }>["content"][number];
type ToolPart = Extract<LlmMessage, { role: "tool" }>["content"][number];

const keepFirstOccurrence = <TPart extends AssistantPart | ToolPart>(
  parts: TPart[],
  seen: Set<string>,
) =>
  parts.filter((part) => {
    if (part.type !== "tool-call" && part.type !== "tool-result") {
      return true;
    }

    const key = `${part.type}:${part.toolCallId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });

/**
 * Safety net for conversations whose stored history already repeats the same
 * toolCallId across assistant messages. Repeated confirmation dialogs read as
 * approvals the model has already collected, so it stops opening the HITL
 * dialog and asks in chat instead. Only the first occurrence of each call and
 * result reaches the provider; this rewrite is transient and never persists.
 */
export class DedupeToolCallsProcessor implements Processor {
  id = "dedupe-tool-calls";

  name = "Dedupe Tool Calls";

  processLLMRequest({
    prompt,
  }: ProcessLLMRequestArgs): ProcessLLMRequestResult {
    const seen = new Set<string>();
    const deduped: LlmMessage[] = [];
    let changed = false;

    for (const message of prompt) {
      if (message.role !== "assistant" && message.role !== "tool") {
        deduped.push(message);
        continue;
      }

      const parts = keepFirstOccurrence(message.content, seen);

      if (parts.length === message.content.length) {
        deduped.push(message);
        continue;
      }

      changed = true;

      if (parts.length === 0) {
        continue;
      }

      deduped.push({ ...message, content: parts } as LlmMessage);
    }

    return changed ? { prompt: deduped } : undefined;
  }
}
