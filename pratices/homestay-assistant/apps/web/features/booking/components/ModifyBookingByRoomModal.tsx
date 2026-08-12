"use client";

import { useCallback, useMemo } from "react";
import { ToolCallStatus, useAgent } from "@copilotkit/react-core/v2";
import {
  AGENT_KEYS,
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";
import { parseToolResult, formatPrice } from "@repo/utils";

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
  resolveModifyPickerBookingsFromMessages,
  shouldRenderHitlCard,
  useHitlRespondOnce,
} from "@/features/booking/utils";
import type {
  ModifyBookingByRoomArgs,
  ModifyBookingByRoomResult,
} from "@repo/schemas";
import type { HitlToolResult } from "@/features/booking/types";
import { MODIFY_BOOKING_PICKER } from "@/features/booking/constants";

type ModifyBookingByRoomModalProps = {
  status: ToolCallStatus;
  args: Partial<ModifyBookingByRoomArgs>;
  respond?: (result: ModifyBookingByRoomResult) => Promise<void>;
  result?: HitlToolResult<ModifyBookingByRoomResult>;
  toolCallId?: string;
};

type BookingItem = NonNullable<ModifyBookingByRoomArgs["bookings"]>[number];

const MODIFY_FOCUS_TASK = {
  type: HOMESTAY_AGENT_TASK_TYPE.MANAGE,
  status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
} as const;

const hasValidBooking = (booking: BookingItem) =>
  Boolean(
    booking.bookingId?.trim() &&
      booking.roomName?.trim() &&
      booking.checkInDate?.trim() &&
      booking.checkOutDate?.trim(),
  );

export const ModifyBookingByRoomModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: ModifyBookingByRoomModalProps) => {
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const { respondOnce, canRespond: canRespondHitl } =
    useHitlRespondOnce<ModifyBookingByRoomResult>(respond);

  const supersedeDismiss = useCallback(() => {
    void respondOnce({ confirmed: false, reason: "declined" });
  }, [respondOnce]);

  const { isActionable, expiredBySupersede } = useSupersedeHitlOnNewInteraction({
    toolCallId,
    canRespond: canRespondHitl,
    onSupersede: supersedeDismiss,
  });

  const canRespond = canRespondHitl && isActionable;

  const bookingsFromArgs = useMemo(
    () => (args.bookings ?? []).filter(hasValidBooking),
    [args.bookings],
  );

  const bookingsFromMessages = useMemo(
    () =>
      resolveModifyPickerBookingsFromMessages(
        agent.messages as
          | {
              role?: string;
              content?: unknown;
              toolCallId?: string;
              toolCalls?: {
                id?: string;
                function?: { name?: string; arguments?: unknown };
              }[];
            }[]
          | undefined,
        args.bookingIds,
      ),
    [agent.messages, args.bookingIds],
  );

  const bookings =
    bookingsFromArgs.length > 0 ? bookingsFromArgs : bookingsFromMessages;

  const hasArgs = bookings.length > 0;
  const decisionStatus = resolveHitlDecisionStatus(status, result);
  const isComplete =
    isHitlDecisionTerminal(decisionStatus) || expiredBySupersede;
  const isAwaitingSelect =
    isHitlToolAwaitingUser(status) && !isComplete && isActionable;
  const parsedResult = parseToolResult<ModifyBookingByRoomResult>(
    result as ModifyBookingByRoomResult | string | null | undefined,
  );

  useReportHomestayAgentUiFocus(
    isAwaitingSelect,
    "modify-flow",
    MODIFY_FOCUS_TASK,
  );

  if (!shouldRenderHitlCard(status, hasArgs)) {
    return null;
  }

  const handleKeepBookings = () => {
    if (!canRespond) {
      return;
    }

    void respondOnce({ confirmed: false, reason: "declined" });
  };

  const handleSelectBooking = (booking: BookingItem) => {
    if (!canRespond) {
      return;
    }

    void respondOnce({
      confirmed: true,
      bookingId: booking.bookingId,
      roomName: booking.roomName,
    });
  };

  if (isComplete) {
    // After the guest picks a stay, hide this picker — the modify confirm /
    // edit HITL is the response (no leftover "Selected by you" card).
    if (
      !expiredBySupersede &&
      decisionStatus === HITL_DECISION_STATUS.APPROVED
    ) {
      return null;
    }

    const completedBooking =
      parsedResult?.confirmed && parsedResult.bookingId
        ? bookings.find((b) => b.bookingId === parsedResult.bookingId)
        : bookings.length === 1
          ? bookings[0]
          : null;

    return (
      <EmbeddedWidget>
        <div className="space-y-3 p-3.5 text-zinc-100">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-white">
              {expiredBySupersede
                ? MODIFY_BOOKING_PICKER.completed.rejectedTitle
                : decisionStatus === HITL_DECISION_STATUS.REJECTED
                  ? MODIFY_BOOKING_PICKER.completed.rejectedTitle
                  : decisionStatus === HITL_DECISION_STATUS.APPROVED
                    ? MODIFY_BOOKING_PICKER.completed.approvedTitle
                    : MODIFY_BOOKING_PICKER.completed.rejectedTitle}
            </h3>
            <p className="text-xs text-zinc-400">
              {expiredBySupersede
                ? MODIFY_BOOKING_PICKER.completed.expiredBody(
                    args.queryName ?? "",
                  )
                : decisionStatus === HITL_DECISION_STATUS.REJECTED
                  ? MODIFY_BOOKING_PICKER.completed.keptAll(args.queryName ?? "")
                  : completedBooking
                    ? `${completedBooking.roomName} · ${completedBooking.checkInDate} → ${completedBooking.checkOutDate}`
                    : MODIFY_BOOKING_PICKER.completed.multiMatch(
                        args.queryName ?? "",
                      )}
            </p>
          </div>

          {!completedBooking && (
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
          )}
        </div>
      </EmbeddedWidget>
    );
  }

  return (
    <EmbeddedWidget>
      <div className="space-y-3 p-3.5 text-zinc-100">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-white">
            {MODIFY_BOOKING_PICKER.title}
          </h3>
          <p className="text-xs text-zinc-400">
            {MODIFY_BOOKING_PICKER.description(args.queryName ?? "")}
          </p>
        </div>

        <div className="space-y-2">
          {bookings.map((booking) => (
            <button
              key={booking.bookingId}
              type="button"
              disabled={!canRespond}
              className="flex w-full flex-col rounded-lg border border-white/8 bg-white/[0.02] p-3 text-left text-xs transition hover:bg-white/[0.05] disabled:opacity-50"
              onClick={() => handleSelectBooking(booking)}
            >
              <span className="font-medium text-zinc-100">
                {booking.roomName}
              </span>
              <span className="text-zinc-400">
                {booking.checkInDate} → {booking.checkOutDate}
              </span>
              <span className="text-zinc-400">
                Total price: {formatPrice(booking.totalPrice)}
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
            {MODIFY_BOOKING_PICKER.keepLabel}
          </Button>
        </div>
      </div>
    </EmbeddedWidget>
  );
};
