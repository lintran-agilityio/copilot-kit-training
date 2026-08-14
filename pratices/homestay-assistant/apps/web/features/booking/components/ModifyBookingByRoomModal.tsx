"use client";

import { useMemo } from "react";
import { ToolCallStatus, useAgent } from "@copilotkit/react-core/v2";
import {
  AGENT_KEYS,
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";
import { parseToolResult } from "@repo/utils";

import { EmbeddedWidget } from "@/features/chat/components";
import { useReportHomestayAgentUiFocus } from "@/features/chat/hooks";
import {
  hasBookingPickerFields,
  isHitlDecisionTerminal,
  isHitlToolAwaitingUser,
  resolveHitlDecisionStatus,
  resolveModifyPickerBookingsFromMessages,
  resolvePickerCompletedTitle,
  shouldRenderHitlCard,
} from "@/features/booking/utils";
import { useHitlPickerDismiss } from "@/features/booking/hooks";
import type {
  ModifyBookingByRoomArgs,
  ModifyBookingByRoomResult,
} from "@repo/schemas";
import type { BookingDetails, HitlToolResult } from "@/features/booking/types";
import { MODIFY_BOOKING_PICKER } from "@/features/booking/constants";
import { BookingPickerCard } from "./BookingPickerCard";
import { HITL_DECISION_STATUS } from "@/constants";

type ModifyBookingByRoomModalProps = {
  status: ToolCallStatus;
  args: Partial<ModifyBookingByRoomArgs>;
  respond?: (result: ModifyBookingByRoomResult) => Promise<void>;
  result?: HitlToolResult<ModifyBookingByRoomResult>;
  toolCallId?: string;
};

const MODIFY_FOCUS_TASK = {
  type: HOMESTAY_AGENT_TASK_TYPE.MANAGE,
  status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
} as const;

export const ModifyBookingByRoomModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: ModifyBookingByRoomModalProps) => {
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const { respondOnce, canRespond, isActionable, expiredBySupersede } =
    useHitlPickerDismiss<ModifyBookingByRoomResult>(respond, toolCallId, {
      confirmed: false,
      reason: "declined",
    });

  const bookingsFromArgs = useMemo(
    () => (args.bookings ?? []).filter(hasBookingPickerFields),
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

  const handleSelectBooking = (booking: BookingDetails) => {
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
        <BookingPickerCard
          title={resolvePickerCompletedTitle(
            MODIFY_BOOKING_PICKER,
            decisionStatus,
            expiredBySupersede,
          )}
          description={
            expiredBySupersede
              ? MODIFY_BOOKING_PICKER.completed.expiredBody(
                  args.queryName ?? "",
                )
              : decisionStatus === HITL_DECISION_STATUS.REJECTED
                ? MODIFY_BOOKING_PICKER.completed.keptAll(args.queryName ?? "")
                : completedBooking
                  ? `${completedBooking.roomName} · ${completedBooking.checkInDate} → ${completedBooking.checkOutDate}`
                  : MODIFY_BOOKING_PICKER.completed.multiMatch(
                      args.queryName ?? "",
                    )
          }
          bookings={completedBooking ? [] : bookings}
        />
      </EmbeddedWidget>
    );
  }

  return (
    <EmbeddedWidget>
      <BookingPickerCard
        title={MODIFY_BOOKING_PICKER.title}
        description={MODIFY_BOOKING_PICKER.description(args.queryName ?? "")}
        bookings={bookings}
        disabled={!canRespond}
        onSelect={handleSelectBooking}
        keepLabel={MODIFY_BOOKING_PICKER.keepLabel}
        onKeep={handleKeepBookings}
      />
    </EmbeddedWidget>
  );
};
