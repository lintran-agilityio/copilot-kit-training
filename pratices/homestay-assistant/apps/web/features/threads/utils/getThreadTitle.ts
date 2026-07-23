import type { Thread, ThreadPrimaryIntent } from "@/features/threads/types";

const INTENT_TITLES: Record<ThreadPrimaryIntent, string> = {
  room_discovery: "Find a room",
  booking: "Book a room",
  cancellation: "Cancel booking",
  view_bookings: "View bookings",
};

/**
 * MVP title: first user message (Option A).
 * Falls back to intent label (Option B) or "New chat".
 */
export const getThreadTitle = (
  thread: Pick<Thread, "title" | "lastMessage" | "metadata">,
): string => {
  const title = thread.title?.trim();

  if (title) {
    return title;
  }

  const lastMessage = thread.lastMessage?.trim();

  if (lastMessage) {
    return lastMessage.length > 48
      ? `${lastMessage.slice(0, 45)}...`
      : lastMessage;
  }

  const intent = thread.metadata?.primaryIntent;

  if (intent) {
    return INTENT_TITLES[intent];
  }

  return "New chat";
};
