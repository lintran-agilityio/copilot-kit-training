import type { MessageLike } from "@/features/chat/types";

/**
 * Formerly hid assistant text when a dedicated success/unavailable card already
 * answered the turn. Create/cancel/update notices are headless (HITL same-card
 * phases), and actionable Booking Form opening copy is stopped at Mastra
 * (`replyHint` / GENERIC UI RENDERING) — not by blanking chat text here.
 *
 * Always returns false so confirmation, search, availability, and clarification
 * sentences still render. Kept as a named hook for ChatAssistantMessage.
 */
export const isSupersededByToolCard = (
  _messages: MessageLike[] | undefined,
  _messageId: string,
) => false;
