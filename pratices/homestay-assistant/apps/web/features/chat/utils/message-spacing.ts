type ChatMessageRole = "user" | "assistant" | "reasoning" | string;

type ChatMessageLike = {
  id: string;
  role: ChatMessageRole;
};

const GROUPED_TOP_SPACING = "pt-1.5";
const DEFAULT_TOP_SPACING = "pt-4";
/** Embedded widgets sit slightly apart from conversation bubbles. */
const WIDGET_TOP_SPACING = "pt-3";

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

type MessageTopSpacingOptions = {
  /** Tool-only assistant turn — treat as widget block, not a grouped bubble. */
  widgetOnly?: boolean;
};

export const getMessageTopSpacing = (
  messages: ChatMessageLike[] | undefined,
  messageId: string,
  role: "user" | "assistant",
  options?: MessageTopSpacingOptions,
) => {
  if (!messages?.length) {
    return options?.widgetOnly ? WIDGET_TOP_SPACING : DEFAULT_TOP_SPACING;
  }

  const index = messages.findIndex((message) => message.id === messageId);
  if (index <= 0) {
    return options?.widgetOnly ? WIDGET_TOP_SPACING : DEFAULT_TOP_SPACING;
  }

  if (options?.widgetOnly) {
    return WIDGET_TOP_SPACING;
  }

  const previousRole = messages[index - 1]?.role;
  return isSameSenderGroup(role, previousRole)
    ? GROUPED_TOP_SPACING
    : DEFAULT_TOP_SPACING;
};
