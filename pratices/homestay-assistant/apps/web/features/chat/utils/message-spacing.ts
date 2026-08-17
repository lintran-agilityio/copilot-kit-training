import { MESSAGE_ROLE, type MessageRole } from "@repo/constants";

type ChatMessageRole = MessageRole | "reasoning" | string;

type ChatMessageLike = {
  id: string;
  role: ChatMessageRole;
};

const GROUPED_TOP_SPACING = "pt-1.5";
const DEFAULT_TOP_SPACING = "pt-4";
/** Embedded widgets sit slightly apart from conversation bubbles. */
const WIDGET_TOP_SPACING = "pt-3";

const isSameSenderGroup = (
  currentRole: Extract<MessageRole, "user" | "assistant">,
  previousRole: ChatMessageRole | undefined,
) => {
  if (!previousRole) {
    return false;
  }

  if (currentRole === MESSAGE_ROLE.USER) {
    return previousRole === MESSAGE_ROLE.USER;
  }

  return previousRole === MESSAGE_ROLE.ASSISTANT || previousRole === "reasoning";
};

type MessageTopSpacingOptions = {
  /** Tool-only assistant turn — treat as widget block, not a grouped bubble. */
  widgetOnly?: boolean;
};

export const getMessageTopSpacing = (
  messages: ChatMessageLike[] | undefined,
  messageId: string,
  role: Extract<MessageRole, "user" | "assistant">,
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
