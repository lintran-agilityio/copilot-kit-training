"use client";

import { CalendarCheck, Minus, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useRequestRoomBooking } from "@/features/booking/hooks/use-request-room-booking";
import { useBooking } from "@/features/booking/hooks/use-booking";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import {
  RoomBookingDates,
  RoomImageGallery,
  AmenitiesRoom,
} from "@/features/room/components";
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
  buildActionPrompt,
} from "@repo/utils";

type RoomDetailProps = Room & {
  className?: string;
  imageUrls?: string[];
};

const dateKeysEqual = (
  a: string | null | undefined,
  b: string | null | undefined
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
  const requestRoomBooking = useRequestRoomBooking();
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
  const [guests, setLocalGuests] = useState(1);

  useEffect(() => {
    if (
      roomCheckInDate &&
      roomCheckOutDate &&
      isCheckOutAfterCheckIn(roomCheckInDate, roomCheckOutDate)
    ) {
      setLocalCheckIn(roomCheckInDate);
      setLocalCheckOut(roomCheckOutDate);
      return;
    }

    const defaults = getDefaultDates();
    setLocalCheckIn(defaults.checkIn);
    setLocalCheckOut(defaults.checkOut);
    setLocalGuests(1);
  }, [id, roomCheckInDate, roomCheckOutDate]);

  useEffect(() => {
    if (
      !checkInDate ||
      !checkOutDate ||
      isCheckOutAfterCheckIn(checkInDate, checkOutDate)
    ) {
      return;
    }

    const adjustedCheckOut = toDateKey(addDays(parseDateKey(checkInDate), 1));
    setLocalCheckOut(adjustedCheckOut);
    setCheckOutDate(adjustedCheckOut);
  }, [checkInDate, checkOutDate, setCheckOutDate]);

  const matchesExistingBooking = useMemo(
    () =>
      Boolean(bookingStatus) &&
      dateKeysEqual(checkInDate, roomCheckInDate) &&
      dateKeysEqual(checkOutDate, roomCheckOutDate),
    [
      bookingStatus,
      checkInDate,
      checkOutDate,
      roomCheckInDate,
      roomCheckOutDate,
    ]
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
      countNightOfDates(checkInDate, checkOutDate) * pricePerNight
    );
  }, [canProceed, checkInDate, checkOutDate, pricePerNight]);

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
      buildActionPrompt({
        action: `Book ${name} from ${checkInDate} to ${checkOutDate} for ${guests} guest${guests === 1 ? "" : "s"}`,
        targetName: name,
        identifiers: { roomId: id },
      })
    );
  };

  const handleCheckInChange = (dateKey: string) => {
    const nextCheckOut =
      checkOutDate && isCheckOutAfterCheckIn(dateKey, checkOutDate)
        ? checkOutDate
        : toDateKey(addDays(parseDateKey(dateKey), 1));

    setLocalCheckIn(dateKey);
    setCheckInDate(dateKey);

    if (nextCheckOut !== checkOutDate) {
      setLocalCheckOut(nextCheckOut);
      setCheckOutDate(nextCheckOut);
    }

    calculateTotalPrice();
  };

  const handleCheckOutChange = (dateKey: string) => {
    setLocalCheckOut(dateKey);
    setCheckOutDate(dateKey);
    calculateTotalPrice();
  };

  const handleGuestsChange = (count: number) => {
    setLocalGuests(count);
    setGuests(count);
  };

  const headerLabel = matchesExistingBooking ? "Your booking" : "Room detail";

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-400">Room not found</p>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-white/8 bg-[#111111]",
        className
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
                  className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none cursor-pointer"
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
                  className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none cursor-pointer"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {matchesExistingBooking ? (
            <p className="text-sm text-zinc-400">
              You already have a booking for these dates. Select different dates
              to book another stay.
            </p>
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

            <Button
              type="button"
              size="lg"
              className="h-11 w-full gap-2 bg-emerald-500 text-base font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed cursor-pointer"
              disabled={!canProceed || isBookingDisabled}
              onClick={handleBook}
            >
              <CalendarCheck className="size-4" />
              Book this room
            </Button>
          </div>
        </>
      </div>
    </article>
  );
};
