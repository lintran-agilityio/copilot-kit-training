"use client";

import { CalendarCheck, CheckCircle2, Minus, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import { useConfirmBookingDraft } from "@/features/booking/hooks/use-confirm-booking-draft";
import { useRequestRoomBooking } from "@/features/booking/hooks/use-request-room-booking";
import { useBooking } from "@/features/booking/hooks/use-booking";
import { AmenitiesRoom } from "@/features/room/components";
import { RoomBookingDates } from "@/features/room/components/RoomBookingDates";
import { RoomImageGallery } from "@/features/room/components/RoomImageGallery";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";
import {
  addDays,
  startOfDay,
  cn,
  toDateKey,
  formatPrice,
  countNightOfDates,
  isCheckOutAfterCheckIn,
  parseDateKey,
} from "@repo/utils";

type RoomDetailProps = Room & {
  className?: string;
  imageUrls?: string[];
};

const dateKeysEqual = (
  a: string | null | undefined,
  b: string | null | undefined,
) => Boolean(a && b && a === b);

const getDefaultDates = () => {
  const today = startOfDay(new Date());
  return {
    checkIn: toDateKey(today),
    checkOut: toDateKey(addDays(today, 1)),
  };
};

export const RoomDetail = ({
  className,
  pricePerNight,
  imageUrls,
  ...room
}: RoomDetailProps) => {
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
  const setCheckInDate = useBooking((state) => state.setCheckInDate);
  const setCheckOutDate = useBooking((state) => state.setCheckOutDate);
  const setGuests = useBooking((state) => state.setGuests);
  const calculateTotalPrice = useBooking((state) => state.calculateTotalPrice);
  const isFormReady = useBooking((state) => state.isFormReady);
  const setFormReady = useBooking((state) => state.setFormReady);
  const formRevision = useBooking((state) => state.formRevision);
  const storeCheckInDate = useBooking((state) => state.checkInDate);
  const storeCheckOutDate = useBooking((state) => state.checkOutDate);
  const storeGuests = useBooking((state) => state.guests);
  const storeSelectedRoomId = useBooking((state) => state.selectedRoom?.id);
  const submitStatus = useBooking((state) => state.submitStatus);
  const submitError = useBooking((state) => state.submitError);
  const createdBooking = useBooking((state) => state.createdBooking);
  const resetBooking = useBooking((state) => state.resetBooking);
  const requestRoomBooking = useRequestRoomBooking();
  const confirmBookingDraft = useConfirmBookingDraft();
  const closeRoomDetailModal = useRoomStore(
    (state) => state.closeRoomDetailModal,
  );

  const {
    id,
    name,
    capacity,
    description,
    imageUrl,
    availableSlots,
    level,
    levelColor,
    amenities = [],
    bookingStatus,
    checkInDate: roomCheckInDate,
    checkOutDate: roomCheckOutDate,
  } = room;

  const [checkInDate, setLocalCheckIn] = useState<string | null>(() => {
    if (roomCheckInDate) {
      return roomCheckInDate;
    }

    return getDefaultDates().checkIn;
  });
  const [checkOutDate, setLocalCheckOut] = useState<string | null>(() => {
    if (roomCheckOutDate) {
      return roomCheckOutDate;
    }

    return getDefaultDates().checkOut;
  });
  const [guests, setLocalGuests] = useState(storeGuests ?? 1);

  useEffect(() => {
    if (roomCheckInDate && roomCheckOutDate && isCheckOutAfterCheckIn(roomCheckInDate, roomCheckOutDate)) {
      setLocalCheckIn(roomCheckInDate);
      setLocalCheckOut(roomCheckOutDate);
      return;
    }

    if (
      storeSelectedRoomId === id &&
      storeCheckInDate &&
      storeCheckOutDate &&
      isCheckOutAfterCheckIn(storeCheckInDate, storeCheckOutDate)
    ) {
      setLocalCheckIn(storeCheckInDate);
      setLocalCheckOut(storeCheckOutDate);
      if (storeGuests) {
        setLocalGuests(storeGuests);
      }
      return;
    }

    const defaults = getDefaultDates();
    setLocalCheckIn(defaults.checkIn);
    setLocalCheckOut(defaults.checkOut);
    setLocalGuests(1);
  }, [id, roomCheckInDate, roomCheckOutDate, storeCheckInDate, storeCheckOutDate, storeGuests, storeSelectedRoomId]);

  useEffect(() => {
    if (storeSelectedRoomId !== id) {
      return;
    }

    if (storeCheckInDate && storeCheckOutDate && !isCheckOutAfterCheckIn(storeCheckInDate, storeCheckOutDate)) {
      return;
    }

    if (storeCheckInDate) {
      setLocalCheckIn(storeCheckInDate);
    }

    if (storeCheckOutDate) {
      setLocalCheckOut(storeCheckOutDate);
    }

    if (storeGuests) {
      setLocalGuests(storeGuests);
    }
  }, [
    formRevision,
    id,
    storeCheckInDate,
    storeCheckOutDate,
    storeGuests,
    storeSelectedRoomId,
  ]);

  useEffect(() => {
    if (!checkInDate || !checkOutDate || isCheckOutAfterCheckIn(checkInDate, checkOutDate)) {
      return;
    }

    setLocalCheckOut(toDateKey(addDays(parseDateKey(checkInDate), 1)));
  }, [checkInDate, checkOutDate]);

  const matchesExistingBooking = useMemo(
    () =>
      Boolean(bookingStatus) &&
      dateKeysEqual(checkInDate, roomCheckInDate) &&
      dateKeysEqual(checkOutDate, roomCheckOutDate),
    [bookingStatus, checkInDate, checkOutDate, roomCheckInDate, roomCheckOutDate],
  );

  const matchesAgentDraft = useMemo(
    () =>
      isFormReady &&
      storeSelectedRoomId === id &&
      dateKeysEqual(checkInDate, storeCheckInDate) &&
      dateKeysEqual(checkOutDate, storeCheckOutDate) &&
      guests === storeGuests,
    [
      isFormReady,
      storeSelectedRoomId,
      id,
      checkInDate,
      checkOutDate,
      storeCheckInDate,
      storeCheckOutDate,
      guests,
      storeGuests,
    ],
  );

  const formattedPrice = formatPrice(pricePerNight);
  const hasValidDateRange =
    checkInDate != null &&
    checkOutDate != null &&
    isCheckOutAfterCheckIn(checkInDate, checkOutDate);

  const canProceed =
    hasValidDateRange &&
    pricePerNight != null &&
    guests >= 1 &&
    guests <= capacity;

  const isBookingDisabled = matchesExistingBooking;

  const estimatedTotal = useMemo(() => {
    if (!canProceed || !pricePerNight || !checkInDate || !checkOutDate) {
      return null;
    }

    return formatPrice(
      countNightOfDates(checkInDate, checkOutDate) * pricePerNight,
    );
  }, [canProceed, checkInDate, checkOutDate, pricePerNight]);

  const invalidateDraftIfDrifted = useCallback(
    (nextCheckIn: string, nextCheckOut: string, nextGuests: number) => {
      if (
        !isFormReady ||
        storeSelectedRoomId !== id ||
        (dateKeysEqual(nextCheckIn, storeCheckInDate) &&
          dateKeysEqual(nextCheckOut, storeCheckOutDate) &&
          nextGuests === storeGuests)
      ) {
        return;
      }

      setFormReady(false);
    },
    [
      id,
      isFormReady,
      setFormReady,
      storeCheckInDate,
      storeCheckOutDate,
      storeGuests,
      storeSelectedRoomId,
    ],
  );

  const syncDraft = () => {
    if (!checkInDate || !checkOutDate || pricePerNight == null) {
      return;
    }

    setSelectedRoom({
      id,
      name,
      pricePerNight,
      capacity,
    });
    setCheckInDate(checkInDate);
    setCheckOutDate(checkOutDate);
    setGuests(guests);
    calculateTotalPrice();
  };

  const handleBook = () => {
    if (
      isBookingDisabled ||
      !canProceed ||
      !checkInDate ||
      !checkOutDate ||
      pricePerNight == null
    ) {
      return;
    }

    syncDraft();
    requestRoomBooking(
      `Book ${name} from ${checkInDate} to ${checkOutDate} for ${guests} guest${guests === 1 ? "" : "s"}.`,
    );
    closeRoomDetailModal();
  };

  const handleConfirm = async () => {
    if (
      isBookingDisabled ||
      !canProceed ||
      !checkInDate ||
      !checkOutDate ||
      pricePerNight == null
    ) {
      return;
    }

    syncDraft();
    await confirmBookingDraft();
  };

  const handleCheckInChange = (dateKey: string) => {
    setLocalCheckIn(dateKey);
    setCheckInDate(dateKey);
    invalidateDraftIfDrifted(dateKey, checkOutDate ?? "", guests);
    calculateTotalPrice();
  };

  const handleCheckOutChange = (dateKey: string) => {
    setLocalCheckOut(dateKey);
    setCheckOutDate(dateKey);
    invalidateDraftIfDrifted(checkInDate ?? "", dateKey, guests);
    calculateTotalPrice();
  };

  const handleGuestsChange = (count: number) => {
    setLocalGuests(count);
    setGuests(count);
    invalidateDraftIfDrifted(checkInDate ?? "", checkOutDate ?? "", count);
  };

  const headerLabel = matchesExistingBooking
    ? "Your booking"
    : matchesAgentDraft
      ? "Review booking"
      : "Room detail";

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-400">Room not found</p>
      </div>
    )
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-white/8 bg-[#111111]",
        className,
      )}
    >
      <RoomImageGallery
        roomId={id}
        imageUrl={imageUrl}
        imageUrls={imageUrls}
        name={name}
        level={level ?? 0}
        levelColor={levelColor ?? ""}
        availableSlots={availableSlots}
      />

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              {headerLabel}
            </p>
            <h2 className="text-xl font-semibold text-white">{name}</h2>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            {bookingStatus ? (
              <BookingStatusBadge status={bookingStatus} />
            ) : null}

            <div className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-zinc-300">
              <Users className="size-4" />
              <span className="text-sm">{capacity} guests</span>
            </div>
          </div>
        </div>

        {formattedPrice ? (
          <p className="text-lg font-medium text-emerald-300">
            {formattedPrice}
            <span className="text-sm font-normal text-zinc-500"> / night</span>
          </p>
        ) : null}

        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
            Amenities
          </p>
          <AmenitiesRoom amenities={amenities} />
        </div>

        {submitStatus === "success" && createdBooking ? (
          <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="size-5" />
              <p className="font-medium">Booking confirmed</p>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Dates</dt>
                <dd className="text-right text-zinc-100">
                  {createdBooking.checkInDate} → {createdBooking.checkOutDate}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Guests</dt>
                <dd className="text-right text-zinc-100">
                  {createdBooking.guests}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Total</dt>
                <dd className="text-right font-medium text-emerald-300">
                  {formatPrice(createdBooking.totalPrice)}
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
              onClick={() => {
                resetBooking();
                closeRoomDetailModal();
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <RoomBookingDates
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInChange={handleCheckInChange}
              onCheckOutChange={handleCheckOutChange}
            />

            <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
                Guests
              </p>

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-zinc-400">
                  Up to {capacity} guest{capacity === 1 ? "" : "s"}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease guests"
                    disabled={guests <= 1}
                    onClick={() => handleGuestsChange(Math.max(1, guests - 1))}
                    className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Minus className="size-4" />
                  </button>

                  <span className="min-w-6 text-center text-sm font-medium text-white">
                    {guests}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase guests"
                    disabled={guests >= capacity}
                    onClick={() =>
                      handleGuestsChange(Math.min(capacity, guests + 1))
                    }
                    className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {matchesExistingBooking ? (
              <p className="text-sm text-zinc-400">
                You already have a booking for these dates. Select different
                dates to book another stay.
              </p>
            ) : null}
            {submitError ? (
              <p className="text-sm text-red-400">{submitError}</p>
            ) : null}

            <div className="space-y-3 border-t border-white/8 pt-4">
              {estimatedTotal ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Estimated total</span>
                  <span className="font-medium text-emerald-300">
                    {estimatedTotal}
                  </span>
                </div>
              ) : null}

              {matchesAgentDraft ? (
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full gap-2 bg-emerald-500 text-base font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed"
                  disabled={
                    !canProceed ||
                    isBookingDisabled ||
                    submitStatus === "submitting"
                  }
                  onClick={() => void handleConfirm()}
                >
                  <CalendarCheck className="size-4" />
                  {submitStatus === "submitting"
                    ? "Creating booking…"
                    : "Confirm booking"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full gap-2 bg-emerald-500 text-base font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed"
                  disabled={!canProceed || isBookingDisabled}
                  onClick={handleBook}
                >
                  <CalendarCheck className="size-4" />
                  Book this room
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
};
