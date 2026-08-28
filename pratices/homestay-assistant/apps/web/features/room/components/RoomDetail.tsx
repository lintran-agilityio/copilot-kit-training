"use client";

import { Award, CalendarCheck, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useRequestRoomBooking, useBooking } from "@/features/booking/hooks";
import { useReportHomestayFocusedRoom } from "@/features/chat/hooks";
import { useRoomBookingEstimate } from "@/features/room/hooks";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";
import { resolveCheckOutAfterCheckInChange } from "@/features/room/utils";
import { buildBookingStayMessage } from "@/features/booking/utils";
import type { Room } from "@/features/room/types/room";
import {
  ARTIFACT_STATUS,
  isArtifactLocked,
} from "@/features/chat/types/artifact";

import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/features/booking/components";
import { RoomBookingDates } from "./RoomBookingDates";
import { RoomBookingEstimatedTotal } from "./RoomBookingEstimatedTotal";
import { RoomBookingGuests } from "./RoomBookingGuests";
import { RoomBookingPricePerNight } from "./RoomBookingPricePerNight";
import { RoomBookingSummaryHeader } from "./RoomBookingSummaryHeader";
import {
  RoomDetailAmenityHighlights,
  RoomDetailQuickStats,
} from "./RoomDetailHighlights";
import { RoomDetailRating } from "./RoomDetailRating";
import { RoomImageGallery } from "./RoomImageGallery";
import {
  ROOM_DETAIL_ENTRY_MODE,
  ROOM_DETAIL_VARIANT,
  type RoomDetailEntryMode,
  type RoomDetailVariant,
} from "@/constants";

import {
  addDays,
  startOfDay,
  cn,
  toDateKey,
  isCheckOutAfterCheckIn,
  parseDateKey,
  formatPrice,
  countNightOfDates,
} from "@repo/utils";

type RoomDetailProps = Room & {
  className?: string;
  imageUrls?: string[];
  variant?: RoomDetailVariant;
  /** How the user opened page detail: view = editable; book = locked dates, no CTA. */
  entryMode?: RoomDetailEntryMode;
  /** Chat generative UI artifact — locks the form after workflow completion. */
  artifactId?: string;
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
  variant = ROOM_DETAIL_VARIANT.PAGE,
  entryMode = ROOM_DETAIL_ENTRY_MODE.VIEW,
  artifactId,
  ...room
}: RoomDetailProps) => {
  const updateBookingDraft = useBooking((state) => state.updateBookingDraft);
  const { requestRoomBooking, isRequesting } = useRequestRoomBooking();
  const artifactStatus = useArtifactStore((state) =>
    artifactId ? state.artifacts[artifactId]?.status : undefined,
  );
  const setArtifactStatus = useArtifactStore((state) => state.setStatus);
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
    guests: roomGuestsHint,
  } = room;

  useReportHomestayFocusedRoom(id);

  const isPage = variant === ROOM_DETAIL_VARIANT.PAGE;
  const isBookEntry = isPage && entryMode === ROOM_DETAIL_ENTRY_MODE.BOOK;
  const artifactLocked = isArtifactLocked(artifactStatus);
  const fieldsReadOnly = isBookEntry || artifactLocked;

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
  const clampGuestsHint = (hint: number | undefined) =>
    hint ? Math.min(Math.max(1, hint), capacity) : 1;

  const [guests, setLocalGuests] = useState(() =>
    clampGuestsHint(roomGuestsHint),
  );

  useEffect(() => {
    if (
      roomCheckInDate &&
      roomCheckOutDate &&
      isCheckOutAfterCheckIn(roomCheckInDate, roomCheckOutDate)
    ) {
      setLocalCheckIn(roomCheckInDate);
      setLocalCheckOut(roomCheckOutDate);
    } else {
      const defaults = getDefaultDates();
      setLocalCheckIn(defaults.checkIn);
      setLocalCheckOut(defaults.checkOut);
    }

    setLocalGuests(clampGuestsHint(roomGuestsHint));
    // clampGuestsHint closes over capacity, already listed below — omitting the
    // function itself avoids re-running this effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clampGuestsHint is stable per capacity dep
  }, [id, roomCheckInDate, roomCheckOutDate, roomGuestsHint, capacity]);

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
    ],
  );

  const { canProceed, estimatedTotal } = useRoomBookingEstimate({
    checkInDate,
    checkOutDate,
    pricePerNight,
    guests,
    capacity,
  });

  const nights =
    checkInDate &&
    checkOutDate &&
    isCheckOutAfterCheckIn(checkInDate, checkOutDate)
      ? countNightOfDates(checkInDate, checkOutDate)
      : 0;

  const isBookingDisabled = matchesExistingBooking || artifactLocked;
  const showBookButton = !isBookEntry;
  const isSubmittingArtifact =
    artifactStatus === ARTIFACT_STATUS.SUBMITTING || isRequesting;

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
    if (artifactId) {
      setArtifactStatus(artifactId, ARTIFACT_STATUS.SUBMITTING);
    }
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
    if (fieldsReadOnly) {
      return;
    }

    const next = resolveCheckOutAfterCheckInChange(dateKey, checkOutDate);
    setLocalCheckIn(next.checkInDate);
    if (next.checkOutDate !== checkOutDate) {
      setLocalCheckOut(next.checkOutDate);
    }
  };

  const headerLabel = matchesExistingBooking
    ? "Your booking"
    : variant === ROOM_DETAIL_VARIANT.CHAT_BOOKING
      ? "Book this room"
      : "Room detail";

  const bookingFields = (
    <>
      <RoomBookingDates
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        disabled={fieldsReadOnly}
        onCheckInChange={handleCheckInChange}
        onCheckOutChange={fieldsReadOnly ? () => undefined : setLocalCheckOut}
      />

      <RoomBookingGuests
        guests={guests}
        capacity={capacity}
        disabled={fieldsReadOnly}
        onGuestsChange={fieldsReadOnly ? () => undefined : setLocalGuests}
      />

      {matchesExistingBooking ? (
        <p className="text-sm text-muted-foreground">
          You already have a booking for these dates. Select different dates to
          book another stay.
        </p>
      ) : null}
    </>
  );

  const priceBreakdown = (
    <div className="space-y-3 border-t border-border pt-4">
      {pricePerNight != null && nights > 0 ? (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">
              {formatPrice(pricePerNight)} x {nights} night
              {nights === 1 ? "" : "s"}
            </span>
            <span className="text-foreground">
              {formatPrice(pricePerNight * nights)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Taxes & fees</span>
            <span className="text-foreground">Included</span>
          </div>
        </div>
      ) : null}

      {estimatedTotal ? (
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-foreground">Estimated total</span>
          <span className="text-lg font-semibold text-foreground">
            {estimatedTotal}
          </span>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">You won&apos;t be charged yet</p>

      {showBookButton ? (
        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 text-base font-medium disabled:cursor-not-allowed cursor-pointer"
          disabled={!canProceed || isBookingDisabled || isSubmittingArtifact}
          onClick={handleBook}
        >
          <CalendarCheck className="size-4" />
          {isSubmittingArtifact ? "Starting booking…" : "Book this room"}
        </Button>
      ) : null}
    </div>
  );

  if (isPage) {
    return (
      <article className={cn("space-y-6", className)}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            <RoomImageGallery
              roomId={id}
              imageUrl={imageUrl}
              imageUrls={imageUrls}
              name={name}
              level={level ?? 0}
              levelColor={levelColor ?? ""}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-serif text-2xl font-normal tracking-tight text-foreground md:text-4xl">
                  {name}
                </h2>
                {bookingStatus ? (
                  <BookingStatusBadge status={bookingStatus} />
                ) : null}
              </div>

              <RoomDetailRating />

              <RoomDetailQuickStats
                capacity={capacity}
                level={level ?? 0}
              />

              {description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}

              <RoomDetailAmenityHighlights amenities={amenities} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-4">
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              {pricePerNight != null ? (
                <div className="space-y-2">
                  <RoomBookingPricePerNight
                    pricePerNight={pricePerNight}
                    className="text-2xl"
                  />
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gold">
                    <Award className="size-3.5" />
                    Best price guaranteed
                  </p>
                </div>
              ) : null}

              {bookingFields}

              {availableSlots > 0 && availableSlots <= 3 ? (
                <div className="flex items-start gap-2 rounded-lg border border-gold/35 bg-gold/10 px-3 py-2.5 text-sm text-gold">
                  <Clock3 className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Only {availableSlots} room
                    {availableSlots === 1 ? "" : "s"} left for your dates!
                  </span>
                </div>
              ) : null}

              {priceBreakdown}
            </div>
          </aside>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-4">
        <RoomBookingSummaryHeader
          label={headerLabel}
          name={name}
          capacityText={`${capacity} guests`}
          labelClassName="tracking-[0.2em]"
          nameClassName="text-lg font-semibold"
          aside={
            bookingStatus ? (
              <BookingStatusBadge status={bookingStatus} />
            ) : undefined
          }
        />

        {bookingFields}

        <div className="space-y-3 border-t border-border pt-4">
          <RoomBookingEstimatedTotal estimatedTotal={estimatedTotal} />

          <Button
            type="button"
            size="lg"
            className="h-11 w-full gap-2 text-base font-medium disabled:cursor-not-allowed cursor-pointer bg-primary"
            disabled={!canProceed || isBookingDisabled || isSubmittingArtifact}
            onClick={handleBook}
          >
            <CalendarCheck className="size-4" />
            {isSubmittingArtifact ? "Starting booking…" : "Book this room"}
          </Button>
        </div>
      </div>
    </article>
  );
};
