"use client";

import { useCallback, useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";
import {
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";
import { parseToolResult } from "@repo/utils";

import { Button } from "@/components/ui/button";
import { EmbeddedWidget } from "@/features/chat/components";
import {
  useReportHomestayAgentUiFocus,
  useSupersedeHitlOnNewInteraction,
} from "@/features/chat/hooks";
import {
  HITL_DECISION_STATUS,
  isHitlDecisionTerminal,
  isHitlToolAwaitingUser,
  resolveHitlDecisionStatus,
  shouldRenderHitlCard,
  useHitlRespondOnce,
} from "@/features/booking/utils";
import type {
  CancelBookingByRoomArgs,
  CancelBookingByRoomResult,
} from "@/features/booking/schemas";
import type { BookingDetails } from "@/features/booking/types";
import { CONFIRM_CANCEL_BOOKING } from "@/features/booking/constants";
import { ConfirmCancelBookingModal } from "./ConfirmCancelBookingModal";

type CancelBookingByRoomModalProps = {
  status: ToolCallStatus;
  args: Partial<CancelBookingByRoomArgs>;
  respond?: (result: CancelBookingByRoomResult) => Promise<void>;
  result?: unknown;
  toolCallId?: string;
};

type BookingItem = CancelBookingByRoomArgs["bookings"][number];

const toBookingDetails = (booking: BookingItem): BookingDetails => ({
  bookingId: booking.bookingId,
  roomName: booking.roomName,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  guests: booking.guests,
  totalPrice: booking.totalPrice,
});

const hasValidBooking = (booking: BookingItem) =>
  Boolean(
    booking.bookingId?.trim() &&
      booking.roomName?.trim() &&
      booking.checkInDate?.trim() &&
      booking.checkOutDate?.trim(),
  );

export const CancelBookingByRoomModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: CancelBookingByRoomModalProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(
    null,
  );
  const { respondOnce, canRespond: canRespondHitl } =
    useHitlRespondOnce<CancelBookingByRoomResult>(respond);

  const supersedeDismiss = useCallback(() => {
    void respondOnce({ confirmed: false, reason: "declined" });
  }, [respondOnce]);

  const { isActionable, expiredBySupersede } = useSupersedeHitlOnNewInteraction({
    toolCallId,
    canRespond: canRespondHitl,
    onSupersede: supersedeDismiss,
  });

  const canRespond = canRespondHitl && isActionable;

  const bookings = (args.bookings ?? []).filter(hasValidBooking);
  const hasArgs = bookings.length > 0;
  const decisionStatus = resolveHitlDecisionStatus(status, result);
  const isComplete =
    isHitlDecisionTerminal(decisionStatus) || expiredBySupersede;
  const isAwaitingCancel =
    isHitlToolAwaitingUser(status) && !isComplete && isActionable;
  const parsedResult = parseToolResult<CancelBookingByRoomResult>(
    result as CancelBookingByRoomResult | string | null | undefined,
  );

  useReportHomestayAgentUiFocus(isAwaitingCancel, "cancel-flow", {
    type: HOMESTAY_AGENT_TASK_TYPE.CANCEL,
    status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
  });

  if (!shouldRenderHitlCard(status, hasArgs)) {
    return null;
  }

  const handleKeepBookings = () => {
    if (!canRespond) {
      return;
    }

    void respondOnce({ confirmed: false, reason: "declined" });
  };

  const confirmRespond = (bookingItem: BookingDetails) =>
    canRespond
      ? async (cancelResult: { confirmed: boolean; bookingId?: string }) => {
          if (cancelResult.confirmed && cancelResult.bookingId) {
            await respondOnce({
              confirmed: true,
              bookingId: cancelResult.bookingId,
              roomName: bookingItem.roomName,
            });
            return;
          }

          await respondOnce({ confirmed: false, reason: "declined" });
        }
      : undefined;

  // After completion, prefer the confirmed booking card when we know which one.
  if (isComplete) {
    const completedBooking =
      parsedResult?.confirmed && parsedResult.bookingId
        ? bookings.find((b) => b.bookingId === parsedResult.bookingId)
        : bookings.length === 1
          ? bookings[0]
          : null;

    if (completedBooking) {
      return (
        <ConfirmCancelBookingModal
          status={status}
          bookingItem={toBookingDetails(completedBooking)}
          result={result}
          toolCallId={toolCallId}
          forceExpired={expiredBySupersede}
        />
      );
    }

    return (
      <EmbeddedWidget>
        <div className="space-y-3 p-3.5 text-zinc-100">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-white">
              {expiredBySupersede
                ? CONFIRM_CANCEL_BOOKING.title.expired
                : decisionStatus === HITL_DECISION_STATUS.REJECTED
                  ? "Cancelled by you"
                  : decisionStatus === HITL_DECISION_STATUS.APPROVED
                    ? "Confirmed by you"
                    : CONFIRM_CANCEL_BOOKING.title.expired}
            </h3>
            <p className="text-xs text-zinc-400">
              {expiredBySupersede
                ? `This cancellation confirmation for “${args.queryName}” is no longer available.`
                : decisionStatus === HITL_DECISION_STATUS.REJECTED
                  ? `You kept all bookings matching “${args.queryName}”.`
                  : `Multiple bookings match “${args.queryName}”.`}
            </p>
          </div>

          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="flex w-full flex-col rounded-lg border border-white/8 bg-white/[0.02] p-3 text-left text-xs"
              >
                <span className="font-medium text-zinc-100">
                  {booking.roomName}
                </span>
                <span className="text-zinc-400">
                  {booking.checkInDate} → {booking.checkOutDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      </EmbeddedWidget>
    );
  }

  if (bookings.length === 1 && bookings[0]) {
    return (
      <ConfirmCancelBookingModal
        status={status}
        bookingItem={toBookingDetails(bookings[0])}
        respond={confirmRespond(toBookingDetails(bookings[0]))}
        result={result}
        toolCallId={toolCallId}
      />
    );
  }

  if (selectedBooking) {
    return (
      <ConfirmCancelBookingModal
        status={status}
        bookingItem={selectedBooking}
        respond={confirmRespond(selectedBooking)}
        result={result}
        toolCallId={toolCallId}
      />
    );
  }

  return (
    <EmbeddedWidget>
      <div className="space-y-3 p-3.5 text-zinc-100">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-white">
            Which booking should be cancelled?
          </h3>
          <p className="text-xs text-zinc-400">
            Multiple bookings match &ldquo;{args.queryName}&rdquo;. Select one to
            cancel.
          </p>
        </div>

        <div className="space-y-2">
          {bookings.map((booking) => (
            <button
              key={booking.bookingId}
              type="button"
              disabled={!canRespond}
              className="flex w-full flex-col rounded-lg border border-white/8 bg-white/[0.02] p-3 text-left text-xs transition hover:bg-white/[0.05] disabled:opacity-50"
              onClick={() => setSelectedBooking(toBookingDetails(booking))}
            >
              <span className="font-medium text-zinc-100">{booking.roomName}</span>
              <span className="text-zinc-400">
                {booking.checkInDate} → {booking.checkOutDate}
              </span>
            </button>
          ))}
        </div>

        <div className="pt-0.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            disabled={!canRespond}
            onClick={handleKeepBookings}
          >
            Keep bookings
          </Button>
        </div>
      </div>
    </EmbeddedWidget>
  );
};
