import { MESSAGE_ROLE } from "@repo/constants";
import type { MessageLike } from "@/features/chat/types";

/**
 * True when another tool ran later in the same turn (before the next user
 * message) after the given tool call. A guest-facing answer (Room List,
 * booking-list) is always the LAST tool call of its turn; an internal
 * resolve-style lookup (find_room / get_bookings with purpose:"resolve") is
 * always followed by more tool activity (get_bookings, find_booking_by_id, a
 * picker, a confirm dialog, ...) once its result comes back. Used as a
 * determinism fallback so a resolve-purpose card stays hidden even if a call
 * forgot to pass purpose.
 *
 * Only counts activity in a LATER assistant message, never a co-occurring
 * call in the same message: every real resolve chain needs the previous
 * step's result (a roomId, a bookingId) before the next tool can be called,
 * so it can never be emitted as a parallel call alongside this one — a
 * parallel call in the same message is always an unrelated request (e.g.
 * "show rooms and my bookings" batching find_room + get_bookings together),
 * not evidence this call was a resolve lookup.
 */
export const hasLaterToolCallInTurn = (
  messages: MessageLike[] | undefined,
  toolCallId: string | undefined,
): boolean => {
  if (!messages?.length || !toolCallId) {
    return false;
  }

  const callIndex = messages.findIndex(
    (message) =>
      message.role === MESSAGE_ROLE.ASSISTANT &&
      (message.toolCalls ?? []).some((call) => call.id === toolCallId),
  );

  if (callIndex < 0) {
    return false;
  }

  for (let index = callIndex + 1; index < messages.length; index += 1) {
    const message = messages[index];
    if (message?.role === MESSAGE_ROLE.USER) {
      return false;
    }
    if (
      message?.role === MESSAGE_ROLE.ASSISTANT &&
      (message.toolCalls ?? []).length > 0
    ) {
      return true;
    }
  }

  return false;
};
