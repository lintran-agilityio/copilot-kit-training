"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isHitlToolRespondable,
  useHitlRespondOnce,
} from "@/features/booking/utils";
import type {
  EditModifyBookingArgs,
  EditModifyBookingResult,
} from "@/features/booking/schemas";
import {
  RoomBookingDates,
  RoomBookingEstimatedTotal,
  RoomBookingGuests,
  RoomBookingPreviewCard,
} from "@/features/room/components";
import { useReportHomestayAgentWorkflow } from "@/features/chat/hooks";
import { useRoomBookingEstimate } from "@/features/room/hooks";
import { resolveCheckOutAfterCheckInChange } from "@/features/room/utils";

type EditModifyBookingModalProps = {
  status: ToolCallStatus;
  args: Partial<EditModifyBookingArgs>;
  respond?: (result: EditModifyBookingResult) => Promise<void>;
};

const hasRequiredArgs = (args: Partial<EditModifyBookingArgs>) =>
  Boolean(
    args.bookingId?.trim() &&
      args.room?.id?.trim() &&
      args.room?.name?.trim() &&
      typeof args.room?.capacity === "number" &&
      typeof args.room?.pricePerNight === "number" &&
      args.checkInDate?.trim() &&
      args.checkOutDate?.trim() &&
      typeof args.guests === "number" &&
      args.guests > 0,
  );

export const EditModifyBookingModal = ({
  status,
  args,
  respond,
}: EditModifyBookingModalProps) => {
  const { respondOnce, canRespond: canRespondHitl } =
    useHitlRespondOnce<EditModifyBookingResult>(respond);

  const ready = isHitlToolRespondable(status, respond) && hasRequiredArgs(args);

  const bookingId = args.bookingId ?? "";

  useReportHomestayAgentWorkflow(
    ready,
    "modify-flow",
    { type: "manage", status: "in-progress" },
    ready ? { type: "booking", id: bookingId } : undefined,
  );
  const room = args.room;
  const initialCheckIn = args.checkInDate?.trim() || null;
  const initialCheckOut = args.checkOutDate?.trim() || null;
  const initialGuests =
    typeof args.guests === "number" && args.guests > 0 ? args.guests : 1;

  const [checkInDate, setCheckInDate] = useState<string | null>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(
    initialCheckOut,
  );
  const [guests, setGuests] = useState(initialGuests);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [datesSeed, setDatesSeed] = useState(
    `${initialCheckIn ?? ""}:${initialCheckOut ?? ""}`,
  );

  useEffect(() => {
    if (!ready || !initialCheckIn || !initialCheckOut || !room) {
      return;
    }

    const nextSeed = `${initialCheckIn}:${initialCheckOut}`;
    setCheckInDate(initialCheckIn);
    setCheckOutDate(initialCheckOut);
    setGuests(Math.min(Math.max(1, initialGuests), room.capacity));
    setErrorMessage(null);
    setDatesSeed(nextSeed);
  }, [ready, initialCheckIn, initialCheckOut, initialGuests, room]);

  const canRespond = canRespondHitl && ready && room != null;

  const { canProceed, estimatedTotal } = useRoomBookingEstimate({
    checkInDate,
    checkOutDate,
    pricePerNight: room?.pricePerNight,
    guests,
    capacity: room?.capacity ?? 0,
  });

  const canSubmit = canRespond && canProceed;

  if (!ready || !room) {
    return null;
  }

  const handleCancel = () => {
    if (!canRespond) {
      return;
    }

    void respondOnce({ confirmed: false });
  };

  const handleCheckInChange = (dateKey: string) => {
    const next = resolveCheckOutAfterCheckInChange(dateKey, checkOutDate);
    setCheckInDate(next.checkInDate);
    if (next.checkOutDate !== checkOutDate) {
      setCheckOutDate(next.checkOutDate);
    }
  };

  const handleConfirm = async () => {
    if (!canSubmit || !checkInDate || !checkOutDate) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await respondOnce({
        confirmed: true,
        bookingId,
        roomId: room.id,
        checkInDate,
        checkOutDate,
        guests,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to continue booking update",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionsDisabled = !canRespond || isSubmitting;

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && canRespond && !isSubmitting) {
          handleCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!isSubmitting}
        className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#111111] text-zinc-100 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-white">
            Modify your booking
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update check-in, check-out, or guests for{" "}
            <span className="font-medium text-zinc-200">{room.name}</span>. The
            room stays the same.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RoomBookingPreviewCard
            name={room.name}
            imageUrl={room.imageUrl}
            capacity={room.capacity}
            pricePerNight={room.pricePerNight}
          />

          <RoomBookingDates
            key={datesSeed}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            onCheckInChange={handleCheckInChange}
            onCheckOutChange={setCheckOutDate}
          />

          <RoomBookingGuests
            guests={guests}
            capacity={room.capacity}
            disabled={actionsDisabled}
            onGuestsChange={setGuests}
          />

          <RoomBookingEstimatedTotal estimatedTotal={estimatedTotal} />

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-white/8 bg-transparent sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white cursor-pointer"
            disabled={actionsDisabled}
            onClick={handleCancel}
          >
            Keep current booking
          </Button>
          <Button
            type="button"
            className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer"
            disabled={!canSubmit || isSubmitting}
            onClick={handleConfirm}
          >
            <CalendarCheck className="size-4" />
            {isSubmitting ? "Continuing…" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
