"use client";

import { CalendarCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useRequestRoomBooking } from "@/features/booking/hooks/use-request-room-booking";
import { useBooking } from "@/features/booking/hooks/use-booking";
import { useReportHomestayFocusedRoom } from "@/features/chat/hooks/use-report-homestay-focused-room";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import {
  RoomBookingDates,
  RoomBookingEstimatedTotal,
  RoomBookingGuests,
  RoomBookingPricePerNight,
  RoomBookingSummaryHeader,
  RoomImageGallery,
  AmenitiesRoom,
} from "@/features/room/components";
import { useRoomBookingEstimate } from "@/features/room/hooks";
import { resolveCheckOutAfterCheckInChange } from "@/features/room/utils";
import type { Room } from "@/features/room/types/room";
import { buildBookingStayMessage } from "@/features/booking/utils/build-messages";
import {
  addDays,
  startOfDay,
  cn,
  toDateKey,
  isCheckOutAfterCheckIn,
  parseDateKey,
} from "@repo/utils";

type RoomDetailProps = Room & {
  className?: string;
  imageUrls?: string[];
  variant?: "page" | "chat-booking";
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
  variant = "page",
  ...room
}: RoomDetailProps) => {
  const updateBookingDraft = useBooking((state) => state.updateBookingDraft);
  const { requestRoomBooking, isRequesting } = useRequestRoomBooking();
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

  useReportHomestayFocusedRoom(id);

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
  }, [checkInDate, checkOutDate]);

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

  const { canProceed, estimatedTotal } = useRoomBookingEstimate({
    checkInDate,
    checkOutDate,
    pricePerNight,
    guests,
    capacity,
  });

  const isBookingDisabled = matchesExistingBooking;

  const syncDraft = () => {
    if (!checkInDate || !checkOutDate || pricePerNight == null) {
      return;
    }

    updateBookingDraft({
      roomId: id,
      checkInDate,
      checkOutDate,
      guests,
    });
  };

  const handleBook = () => {
    if (
      isBookingDisabled ||
      isRequesting ||
      !canProceed ||
      !checkInDate ||
      !checkOutDate ||
      pricePerNight == null
    ) {
      return;
    }

    syncDraft();
    requestRoomBooking(
      buildBookingStayMessage({
        roomId: id,
        roomName: name,
        checkInDate,
        checkOutDate,
        guests,
      }),
    );
  };

  const handleCheckInChange = (dateKey: string) => {
    const next = resolveCheckOutAfterCheckInChange(dateKey, checkOutDate);
    setLocalCheckIn(next.checkInDate);
    if (next.checkOutDate !== checkOutDate) {
      setLocalCheckOut(next.checkOutDate);
    }
  };

  const headerLabel = matchesExistingBooking
    ? "Your booking"
    : variant === "chat-booking"
      ? "Book this room"
      : "Room detail";

  const bookingSection = (
    <>
      <RoomBookingDates
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        onCheckInChange={handleCheckInChange}
        onCheckOutChange={setLocalCheckOut}
      />

      <RoomBookingGuests
        guests={guests}
        capacity={capacity}
        onGuestsChange={setLocalGuests}
      />

      {matchesExistingBooking ? (
        <p className="text-sm text-zinc-400">
          You already have a booking for these dates. Select different dates to
          book another stay.
        </p>
      ) : null}

      <div className="space-y-3 border-t border-white/8 pt-4">
        <RoomBookingEstimatedTotal estimatedTotal={estimatedTotal} />

        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 bg-emerald-500 text-base font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed cursor-pointer"
          disabled={!canProceed || isBookingDisabled || isRequesting}
          onClick={handleBook}
        >
          <CalendarCheck className="size-4" />
          {isRequesting ? "Starting booking…" : "Book this room"}
        </Button>
      </div>
    </>
  );

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
        className,
      )}
    >
      {variant === "page" ? (
        <RoomImageGallery
          roomId={id}
          imageUrl={imageUrl}
          imageUrls={imageUrls}
          name={name}
          level={level ?? 0}
          levelColor={levelColor ?? ""}
          availableSlots={availableSlots}
        />
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-5",
          variant === "chat-booking" ? "p-4" : "p-5",
        )}
      >
        <RoomBookingSummaryHeader
          label={headerLabel}
          name={name}
          capacityText={`${capacity} guests`}
          labelClassName="tracking-[0.2em]"
          nameClassName={
            variant === "chat-booking" ? "text-lg font-semibold" : "text-xl font-semibold"
          }
          aside={
            bookingStatus ? (
              <BookingStatusBadge status={bookingStatus} />
            ) : undefined
          }
        />

        {variant === "page" && pricePerNight != null ? (
          <RoomBookingPricePerNight pricePerNight={pricePerNight} />
        ) : null}

        {variant === "page" ? (
          <>
            <p className="text-sm leading-relaxed text-zinc-400">{description}</p>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
                Amenities
              </p>
              <AmenitiesRoom amenities={amenities} />
            </div>
          </>
        ) : null}

        {bookingSection}
      </div>
    </article>
  );
};
