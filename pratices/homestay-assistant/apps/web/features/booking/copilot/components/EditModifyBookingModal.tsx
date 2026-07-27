"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { CalendarCheck, Minus, Plus, Users } from "lucide-react";
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
  isHitlToolAwaitingUser,
  isHitlToolFinished,
  useHitlRespondOnce,
} from "@/features/booking/copilot/utils";
import type {
  EditModifyBookingArgs,
  EditModifyBookingResult,
} from "@/features/booking/schemas";
import { RoomBookingDates } from "@/features/room/components/RoomBookingDates";
import {
  FALLBACK_ROOM_IMAGE,
  resolveRoomImage,
} from "@/features/room/utils";
import {
  addDays,
  countNightOfDates,
  formatPrice,
  isCheckOutAfterCheckIn,
  parseDateKey,
  toDateKey,
} from "@repo/utils";

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

  const ready =
    isHitlToolAwaitingUser(status) &&
    !isHitlToolFinished(status) &&
    hasRequiredArgs(args);

  const bookingId = args.bookingId ?? "";
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
  const [imageUrl, setImageUrl] = useState<string | StaticImageData>(
    FALLBACK_ROOM_IMAGE,
  );
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
    setImageUrl(resolveRoomImage(room.imageUrl));
    setErrorMessage(null);
    setDatesSeed(nextSeed);
  }, [ready, initialCheckIn, initialCheckOut, initialGuests, room]);

  const canRespond = canRespondHitl && ready && room != null;

  const hasValidDateRange =
    checkInDate != null &&
    checkOutDate != null &&
    isCheckOutAfterCheckIn(checkInDate, checkOutDate);

  const canSubmit =
    canRespond &&
    hasValidDateRange &&
    guests >= 1 &&
    guests <= (room?.capacity ?? 0);

  const estimatedTotal = useMemo(() => {
    if (!canSubmit || !room || !checkInDate || !checkOutDate) {
      return null;
    }

    return formatPrice(
      countNightOfDates(checkInDate, checkOutDate) * room.pricePerNight,
    );
  }, [canSubmit, checkInDate, checkOutDate, room]);

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
    const nextCheckOut =
      checkOutDate && isCheckOutAfterCheckIn(dateKey, checkOutDate)
        ? checkOutDate
        : toDateKey(addDays(parseDateKey(dateKey), 1));

    setCheckInDate(dateKey);
    if (nextCheckOut !== checkOutDate) {
      setCheckOutDate(nextCheckOut);
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
          <div className="overflow-hidden rounded-xl border border-white/8">
            <div className="relative aspect-[16/10] bg-zinc-900">
              <Image
                src={imageUrl}
                alt={room.name}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
                onError={() => setImageUrl(FALLBACK_ROOM_IMAGE)}
              />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-400">
                    Your booking
                  </p>
                  <h3 className="text-base font-medium text-white">
                    {room.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-zinc-300">
                  <Users className="size-3.5" />
                  <span className="text-xs">up to {room.capacity}</span>
                </div>
              </div>
              <p className="text-sm text-emerald-300">
                {formatPrice(room.pricePerNight)}
                <span className="text-zinc-500"> / night</span>
              </p>
            </div>
          </div>

          <RoomBookingDates
            key={datesSeed}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            onCheckInChange={handleCheckInChange}
            onCheckOutChange={setCheckOutDate}
          />

          <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
              Guests
            </p>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">
                Up to {room.capacity} guest{room.capacity === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease guests"
                  disabled={actionsDisabled || guests <= 1}
                  onClick={() => setGuests((value) => Math.max(1, value - 1))}
                  className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-6 text-center text-sm font-medium text-white">
                  {guests}
                </span>
                <button
                  type="button"
                  aria-label="Increase guests"
                  disabled={actionsDisabled || guests >= room.capacity}
                  onClick={() =>
                    setGuests((value) => Math.min(room.capacity, value + 1))
                  }
                  className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {estimatedTotal ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Estimated total</span>
              <span className="font-medium text-emerald-300">
                {estimatedTotal}
              </span>
            </div>
          ) : null}

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
