import { TOOL_KEYS } from "@repo/constants";
import { parseToolResult } from "@repo/utils";

import type { ModifyBookingPickerItem } from "@repo/schemas";
import type { MessageLike } from "@/features/chat/types";

type GetBookingsListItem = {
  id?: string;
  bookingId?: string;
  roomId?: string;
  roomName?: string;
  room?: { name?: string; id?: string };
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  totalPrice?: number;
};

type GetBookingsToolResult = {
  bookings?: GetBookingsListItem[];
};

const toPickerItem = (
  booking: GetBookingsListItem,
): ModifyBookingPickerItem | null => {
  const bookingId = (booking.bookingId ?? booking.id ?? "").trim();
  const roomName = (booking.roomName ?? booking.room?.name ?? "").trim();
  const roomId = (booking.roomId ?? booking.room?.id ?? "").trim();
  const checkInDate = (booking.checkInDate ?? "").trim();
  const checkOutDate = (booking.checkOutDate ?? "").trim();
  const guests = booking.guests;
  const totalPrice = booking.totalPrice;

  if (
    !bookingId ||
    !roomName ||
    !roomId ||
    !checkInDate ||
    !checkOutDate ||
    typeof guests !== "number" ||
    typeof totalPrice !== "number"
  ) {
    return null;
  }

  return {
    bookingId,
    roomId,
    roomName,
    checkInDate,
    checkOutDate,
    guests,
    totalPrice,
  };
};

const readToolResultContent = (
  messages: MessageLike[],
  toolCallId: string,
): MessageLike["content"] => {
  const toolMessage = messages.find(
    (message) => message.role === "tool" && message.toolCallId === toolCallId,
  );
  return toolMessage?.content ?? null;
};

/**
 * Hydrate modify-picker rows from the latest get_bookings tool result in the
 * transcript (presentation only — does not rewrite agent.messages).
 *
 * Used when show_modify_dialog_select passes bookingIds[] (small args) instead
 * of full bookings[] rows that truncate mid-stream.
 */
export const resolveModifyPickerBookingsFromMessages = (
  messages: MessageLike[] | undefined,
  bookingIds?: string[] | null,
): ModifyBookingPickerItem[] => {
  if (!messages?.length) {
    return [];
  }

  const idSet =
    bookingIds && bookingIds.length > 0
      ? new Set(bookingIds.map((id) => id.trim()).filter(Boolean))
      : null;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") {
      continue;
    }

    for (const toolCall of [...(message.toolCalls ?? [])].reverse()) {
      if (toolCall.function?.name !== TOOL_KEYS.BOOKING.GET || !toolCall.id) {
        continue;
      }

      const parsed = parseToolResult<GetBookingsToolResult>(
        readToolResultContent(messages, toolCall.id) as
          | GetBookingsToolResult
          | string
          | null,
      );

      const rows = parsed?.bookings;
      if (!Array.isArray(rows) || rows.length === 0) {
        continue;
      }

      const mapped = rows
        .map(toPickerItem)
        .filter((item): item is ModifyBookingPickerItem => item != null);

      if (mapped.length === 0) {
        continue;
      }

      if (!idSet) {
        return mapped;
      }

      const filtered = mapped.filter((item) => idSet.has(item.bookingId));
      return filtered.length > 0 ? filtered : mapped;
    }
  }

  return [];
};
