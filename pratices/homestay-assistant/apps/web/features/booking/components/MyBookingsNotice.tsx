"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { parseToolResult } from "@repo/utils";
import { RoomListSkeleton } from "@/components/common/RoomListSkeleton";
import { EmbeddedWidget } from "@/features/chat/components";
import { BookingList } from "@/features/booking/components/BookingList";
import type {
  GetBookingsResult,
  GetBookingsToolProps,
} from "@/features/booking/types";

const MY_BOOKINGS_TITLE = "Your bookings";

/**
 * Renders get_bookings tool output in chat: skeleton while loading, booking
 * cards when done. Mirrors FindRoomNotice's chat-only room results pattern.
 */
export const MyBookingsNotice = ({
  status,
  result,
  parameters,
  toolCallId,
}: GetBookingsToolProps) => {
  // purpose:"resolve" — cancel/modify/change-room resolution fetch, not a
  // guest-facing VIEW/LIST call. Suppress skeleton and card alike; the HITL
  // that follows (confirm dialog or picker) is the response.
  const suppressForResolve = parameters?.purpose === "resolve";

  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    if (suppressForResolve) {
      return null;
    }

    return (
      <EmbeddedWidget className="p-3.5">
        <RoomListSkeleton itemCount={2} className="max-w-full" />
      </EmbeddedWidget>
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }

  const parsed = parseToolResult<GetBookingsResult>(result);

  if (!parsed) {
    return (
      <EmbeddedWidget className="px-3.5 py-3 text-zinc-400">
        Could not load your bookings.{" "}
        {typeof result === "string" ? result.trim() : ""}
      </EmbeddedWidget>
    );
  }

  if ((parsed.purpose ?? parameters?.purpose) === "resolve") {
    return null;
  }

  const bookings = parsed.bookings ?? [];

  if (!bookings.length) {
    return (
      <EmbeddedWidget className="px-3.5 py-3 text-zinc-400">
        No active bookings found.
      </EmbeddedWidget>
    );
  }

  return (
    <EmbeddedWidget unframed className="max-w-[min(100%,420px)]">
      <BookingList
        bookings={bookings}
        title={MY_BOOKINGS_TITLE}
        compact
        className="max-w-full rounded-xl border border-white/12 bg-[#111111] p-3.5"
        toolCallId={toolCallId}
      />
    </EmbeddedWidget>
  );
};
