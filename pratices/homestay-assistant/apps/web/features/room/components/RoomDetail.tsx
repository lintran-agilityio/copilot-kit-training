"use client";

import { CalendarCheck, CheckCircle2, Minus, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCreateBooking } from "@/features/booking/hooks/use-create-booking";
import { useNotifyAgentBookingSummary } from "@/features/booking/hooks/use-notify-agent-booking-summary";
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
} from "@repo/utils";

type RoomDetailProps = Room & {
  className?: string;
  imageUrls?: string[];
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
  const createBooking = useCreateBooking();
  const notifyAgentBookingSummary = useNotifyAgentBookingSummary();
  const closeRoomDetailDrawer = useRoomStore(
    (state) => state.closeRoomDetailDrawer,
  );

  const [checkInDate, setLocalCheckIn] = useState<string | null>(() =>
    toDateKey(startOfDay(new Date())),
  );
  const [checkOutDate, setLocalCheckOut] = useState<string | null>(() =>
    toDateKey(addDays(startOfDay(new Date()), 1)),
  );
  const [guests, setLocalGuests] = useState(1);

  useEffect(() => {
    if (storeSelectedRoomId !== room.id) {
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
    room.id,
    storeCheckInDate,
    storeCheckOutDate,
    storeGuests,
    storeSelectedRoomId,
  ]);

  useEffect(() => {
    if (!checkInDate || !checkOutDate) {
      return;
    }

    const checkIn = new Date(`${checkInDate}T00:00:00`);
    const checkOut = new Date(`${checkOutDate}T00:00:00`);

    if (checkOut <= checkIn) {
      setLocalCheckOut(toDateKey(addDays(checkIn, 1)));
    }
  }, [checkInDate, checkOutDate]);

  const formattedPrice = formatPrice(pricePerNight);
  const canProceed =
    Boolean(checkInDate && checkOutDate && pricePerNight != null) &&
    checkInDate !== checkOutDate &&
    guests >= 1 &&
    guests <= room.capacity;

  const estimatedTotal = useMemo(() => {
    if (!canProceed || !pricePerNight || !checkInDate || !checkOutDate) {
      return null;
    }

    return formatPrice(
      countNightOfDates(checkInDate, checkOutDate) * pricePerNight,
    );
  }, [canProceed, checkInDate, checkOutDate, pricePerNight]);

  const syncDraft = () => {
    if (!checkInDate || !checkOutDate || pricePerNight == null) {
      return;
    }

    setSelectedRoom({
      id: room.id,
      name: room.name,
      pricePerNight,
      capacity: room.capacity,
    });
    setCheckInDate(checkInDate);
    setCheckOutDate(checkOutDate);
    setGuests(guests);
    calculateTotalPrice();
  };

  const handleBook = () => {
    if (!canProceed || !checkInDate || !checkOutDate || pricePerNight == null) {
      return;
    }

    syncDraft();
    requestRoomBooking(
      `Book ${room.name} from ${checkInDate} to ${checkOutDate} for ${guests} guest${guests === 1 ? "" : "s"}.`,
    );
    closeRoomDetailDrawer();
  };

  const handleConfirm = async () => {
    if (!canProceed || !checkInDate || !checkOutDate || pricePerNight == null) {
      return;
    }

    syncDraft();

    try {
      const booking = await createBooking({
        roomId: room.id,
        checkInDate,
        checkOutDate,
        guests,
      });
      await notifyAgentBookingSummary(booking, room.name);
    } catch {
      // submitError is set in useCreateBooking
    }
  };

  const handleCheckInChange = (dateKey: string) => {
    setLocalCheckIn(dateKey);
    setCheckInDate(dateKey);
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

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-white/8 bg-[#111111]",
        className,
      )}
    >
      <RoomImageGallery
        roomId={room.id}
        imageUrl={room.imageUrl}
        imageUrls={imageUrls}
        name={room.name}
        level={room.level}
        levelColor={room.levelColor}
        availableSlots={room.availableSlots}
      />

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              {isFormReady ? "Review booking" : "Room detail"}
            </p>
            <h2 className="text-xl font-semibold text-white">{room.name}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-zinc-300">
            <Users className="size-4" />
            <span className="text-sm">{room.capacity} guests</span>
          </div>
        </div>

        {formattedPrice ? (
          <p className="text-lg font-medium text-emerald-300">
            {formattedPrice}
            <span className="text-sm font-normal text-zinc-500"> / night</span>
          </p>
        ) : null}

        <p className="text-sm leading-relaxed text-zinc-400">
          {room.description}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
            Amenities
          </p>
          <AmenitiesRoom amenities={room.amenities} />
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
                <dd className="text-right text-zinc-100">{createdBooking.guests}</dd>
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
                closeRoomDetailDrawer();
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
                  Up to {room.capacity} guest{room.capacity === 1 ? "" : "s"}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease guests"
                    disabled={guests <= 1}
                    onClick={() =>
                      handleGuestsChange(Math.max(1, guests - 1))
                    }
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
                    disabled={guests >= room.capacity}
                    onClick={() =>
                      handleGuestsChange(Math.min(room.capacity, guests + 1))
                    }
                    className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            </div>

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

              {isFormReady ? (
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full gap-2 bg-emerald-500 text-base font-medium text-black hover:bg-emerald-400"
                  disabled={!canProceed || submitStatus === "submitting"}
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
                  className="h-11 w-full gap-2 bg-emerald-500 text-base font-medium text-black hover:bg-emerald-400"
                  disabled={!canProceed}
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
