"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarRange } from "lucide-react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";
import {
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";
import { BOOKING_DRAFT_MODE } from "@repo/schemas/booking-draft";
import { parseToolResult } from "@repo/utils";

import { Button } from "@/components/ui/button";
import { EmbeddedWidget } from "@/features/chat/components";
import { HitlDecisionUserMessage } from "@/features/booking/components/HitlDecisionUserMessage";
import {
  HITL_DECISION_STATUS,
  isHitlDecisionTerminal,
  isHitlToolRespondable,
  resolveHitlDecisionStatus,
  shouldRenderHitlCard,
  useHitlRespondOnce,
  type HitlDecisionStatus,
} from "@/features/booking/utils";
import type {
  BookingDraftArgs,
  BookingDraftResult,
} from "@/features/booking/schemas/booking-draft-schema";
import {
  RoomBookingDates,
  RoomBookingGuests,
  RoomBookingPreviewCard,
} from "@/features/room/components";
import { useReportHomestayAgentUiFocus } from "@/features/chat/hooks";
import { resolveCheckOutAfterCheckInChange } from "@/features/room/utils";

type BookingDraftHitlModalProps = {
  status: ToolCallStatus;
  args: Partial<BookingDraftArgs>;
  respond?: (result: BookingDraftResult) => Promise<void>;
  result?: unknown;
};

const hasRenderableArgs = (args: Partial<BookingDraftArgs>) =>
  Boolean(
    args.mode === BOOKING_DRAFT_MODE.CREATE &&
      (args.roomId?.trim() || args.room?.id?.trim()) &&
      (args.room?.name?.trim() || args.roomName?.trim()),
  );

const getSettledCopy = (
  decisionStatus: HitlDecisionStatus,
  roomName: string,
): { title: string; description: ReactNode } => {
  if (decisionStatus === HITL_DECISION_STATUS.APPROVED) {
    return {
      title: "Draft confirmed",
      description: (
        <>
          You confirmed stay details for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  if (decisionStatus === HITL_DECISION_STATUS.REJECTED) {
    return {
      title: "Booking cancelled",
      description: (
        <>
          You closed the booking draft for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  return {
    title: "Draft expired",
    description: (
      <>
        This booking draft for{" "}
        <span className="font-medium text-zinc-200">{roomName}</span> is no
        longer available.
      </>
    ),
  };
};

/**
 * CREATE Booking Draft HITL — collects only missing stay fields in one card.
 * Pricing stays on confirm_booking (unchanged lifecycle).
 */
export const BookingDraftHitlModal = ({
  status,
  args,
  respond,
  result,
}: BookingDraftHitlModalProps) => {
  const { respondOnce, canRespond: canRespondHitl } =
    useHitlRespondOnce<BookingDraftResult>(respond);

  const hasArgs = hasRenderableArgs(args);
  const decisionStatus = resolveHitlDecisionStatus(status, result);
  const isComplete = isHitlDecisionTerminal(decisionStatus);
  const ready =
    isHitlToolRespondable(status, respond) && hasArgs && !isComplete;

  const roomId = args.room?.id?.trim() || args.roomId?.trim() || "";
  const roomName = args.room?.name?.trim() || args.roomName?.trim() || "Room";
  const capacity = args.room?.capacity ?? 10;
  const pricePerNight = args.room?.pricePerNight ?? 0;
  const missing = new Set(args.missingFields ?? []);

  const parsedResult = parseToolResult<BookingDraftResult>(
    result as BookingDraftResult | string | null | undefined,
  );

  useReportHomestayAgentUiFocus(
    ready,
    "book-draft-flow",
    {
      type: HOMESTAY_AGENT_TASK_TYPE.BOOK,
      status: HOMESTAY_AGENT_TASK_STATUS.IN_PROGRESS,
    },
    roomId ? { type: "room", id: roomId } : undefined,
  );

  const initialCheckIn =
    (parsedResult?.confirmed
      ? parsedResult.checkInDate
      : args.checkInDate)?.trim() || null;
  const initialCheckOut =
    (parsedResult?.confirmed
      ? parsedResult.checkOutDate
      : args.checkOutDate)?.trim() || null;
  const initialGuests =
    parsedResult?.confirmed && typeof parsedResult.guests === "number"
      ? parsedResult.guests
      : typeof args.guests === "number" && args.guests > 0
        ? args.guests
        : null;

  const [checkInDate, setCheckInDate] = useState<string | null>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(
    initialCheckOut,
  );
  const [guests, setGuests] = useState<number>(
    initialGuests ?? Math.min(2, capacity),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasArgs) {
      return;
    }
    setCheckInDate(initialCheckIn);
    setCheckOutDate(initialCheckOut);
    if (initialGuests != null) {
      setGuests(Math.min(Math.max(1, initialGuests), capacity));
    }
    setErrorMessage(null);
  }, [hasArgs, initialCheckIn, initialCheckOut, initialGuests, capacity]);

  const canRespond = canRespondHitl && ready;
  const stayComplete =
    Boolean(checkInDate) &&
    Boolean(checkOutDate) &&
    checkOutDate! > checkInDate! &&
    guests > 0 &&
    guests <= capacity;
  const canSubmit = canRespond && stayComplete;

  if (!shouldRenderHitlCard(status, hasArgs)) {
    return null;
  }

  const handleCancel = () => {
    if (!canRespond) {
      return;
    }
    void respondOnce({ confirmed: false });
  };

  const handleCheckInChange = (dateKey: string) => {
    if (isComplete) {
      return;
    }
    const next = resolveCheckOutAfterCheckInChange(dateKey, checkOutDate);
    setCheckInDate(next.checkInDate);
    if (next.checkOutDate !== checkOutDate) {
      setCheckOutDate(next.checkOutDate);
    }
  };

  const handleConfirm = async () => {
    if (!canSubmit || !checkInDate || !checkOutDate || !roomId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await respondOnce({
        confirmed: true,
        mode: BOOKING_DRAFT_MODE.CREATE,
        roomId,
        checkInDate,
        checkOutDate,
        guests,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to continue booking draft",
      );
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    const copy = getSettledCopy(decisionStatus, roomName);
    return (
      <HitlDecisionUserMessage
        icon={CalendarRange}
        title={copy.title}
        description={copy.description}
      />
    );
  }

  const missingCheckout = missing.has("checkOut") || !checkOutDate;
  const missingGuests = missing.has("guests") && initialGuests == null;

  return (
    <EmbeddedWidget className="max-w-md space-y-4 p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Booking Draft
        </p>
        <h3 className="text-base font-medium text-zinc-100">{roomName}</h3>
        <p className="text-sm text-zinc-400">
          {missingCheckout || missingGuests || missing.has("checkIn")
            ? "Fill in the missing stay details to continue."
            : "Review your stay details, then continue."}
        </p>
      </div>

      {args.room ? (
        <RoomBookingPreviewCard
          name={roomName}
          imageUrl={args.room.imageUrl}
          capacity={capacity}
          pricePerNight={pricePerNight}
          label="Selected room"
        />
      ) : null}

      <div className="space-y-3 rounded-lg border border-white/8 p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-zinc-500">Check-in</p>
            <p className="text-zinc-200">{checkInDate ?? "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500">Check-out</p>
            <p className={missingCheckout ? "text-amber-300" : "text-zinc-200"}>
              {checkOutDate ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Guests</p>
            <p className={missingGuests ? "text-amber-300" : "text-zinc-200"}>
              {initialGuests != null || !missingGuests ? guests : "—"}
            </p>
          </div>
        </div>

        <RoomBookingDates
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          onCheckInChange={handleCheckInChange}
          onCheckOutChange={setCheckOutDate}
          disabled={isComplete || isSubmitting}
        />

        <RoomBookingGuests
          guests={guests}
          capacity={capacity}
          onGuestsChange={setGuests}
          disabled={isComplete || isSubmitting}
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-400">{errorMessage}</p>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={!canRespond || isSubmitting}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!canSubmit || isSubmitting}
          onClick={() => void handleConfirm()}
        >
          {missingCheckout ? "Select check-out & continue" : "Continue"}
        </Button>
      </div>
    </EmbeddedWidget>
  );
};
