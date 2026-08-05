export const PROCESSOR_BLOCK_MESSAGE_PREFIX = "@@processor-block@@";

export const PROCESSOR_BLOCK_ASSISTANT_TEXT =
  "Your message couldn't be processed for security reasons. Please rephrase and try again — you can continue booking or asking about rooms normally.";

export const formatProcessorBlockAssistantContent = () =>
  `${PROCESSOR_BLOCK_MESSAGE_PREFIX}\n${PROCESSOR_BLOCK_ASSISTANT_TEXT}`;

export type BlockedMessageMetadata = {
  blocked?: boolean;
};

export const isBlockedMessageMetadata = (
  metadata: unknown,
): metadata is BlockedMessageMetadata =>
  Boolean(
    metadata &&
      typeof metadata === "object" &&
      (metadata as BlockedMessageMetadata).blocked === true,
  );

export const isProcessorBlockAssistantContent = (content: unknown) =>
  typeof content === "string" &&
  content.startsWith(PROCESSOR_BLOCK_MESSAGE_PREFIX);

export const getProcessorBlockAssistantDisplayText = (content: string) => {
  const newlineIndex = content.indexOf("\n");

  if (newlineIndex === -1) {
    return PROCESSOR_BLOCK_ASSISTANT_TEXT;
  }

  return content.slice(newlineIndex + 1).trim() || PROCESSOR_BLOCK_ASSISTANT_TEXT;
};
