type ChatMessageRole = "user" | "assistant" | "reasoning" | string;

type ChatMessageLike = {
  id: string;
  role: ChatMessageRole;
};

const GROUPED_TOP_SPACING = "pt-1.5";
const DEFAULT_TOP_SPACING = "pt-4";

const isSameSenderGroup = (
  currentRole: "user" | "assistant",
  previousRole: ChatMessageRole | undefined,
) => {
  if (!previousRole) {
    return false;
  }

  if (currentRole === "user") {
    return previousRole === "user";
  }

  return previousRole === "assistant" || previousRole === "reasoning";
};

export const getMessageTopSpacing = (
  messages: ChatMessageLike[] | undefined,
  messageId: string,
  role: "user" | "assistant",
) => {
  if (!messages?.length) {
    return DEFAULT_TOP_SPACING;
  }

  const index = messages.findIndex((message) => message.id === messageId);
  if (index <= 0) {
    return DEFAULT_TOP_SPACING;
  }

  const previousRole = messages[index - 1]?.role;
  return isSameSenderGroup(role, previousRole)
    ? GROUPED_TOP_SPACING
    : DEFAULT_TOP_SPACING;
};
