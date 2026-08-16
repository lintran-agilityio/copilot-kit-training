"use client";

import {
  CalendarCheck,
  CalendarRange,
  Pencil,
  Users,
  CalendarX2,
} from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import type { BookingResponse } from "@/features/booking/types/booking";
import { FALLBACK_ROOM_IMAGE, resolveRoomImage } from "@/features/room/utils";
import { cn, formatPrice, formatShortDateForDisplay } from "@repo/utils";
import { Button } from "@/components/ui/button";
import { isBookingCancellable, isBookingModifiable } from "@/features/booking/utils";

type BookingCardProps = {
  booking: BookingResponse;
  className?: string;
  isAgentRunning?: boolean;
  compact?: boolean;
  onCancelBooking?: (booking: BookingResponse) => void;
  onModifyBooking?: (booking: BookingResponse) => void;
};

export const BookingCard = ({
  booking,
  className,
  isAgentRunning = false,
  compact = false,
  onCancelBooking,
  onModifyBooking,
}: BookingCardProps) => {
  const { checkInDate, checkOutDate, guests, totalPrice, status } = booking;
  const room = booking.room;
  const imageUrl = room?.imageUrl ?? "";
  const [url, setUrl] = useState<string | StaticImageData>(
    resolveRoomImage(imageUrl),
  );

  const isCancellable = isBookingCancellable(status, checkOutDate);
  const canModify =
    isCancellable && isBookingModifiable(status, checkInDate) && !isAgentRunning;
  const canCancel = isCancellable && !isAgentRunning;

  const handleCancelBooking = () => {
    if (!room || !canCancel) return;

    onCancelBooking?.(booking);
  };

  const handleModifyBooking = () => {
    if (!room || !canModify) return;

    onModifyBooking?.(booking);
  };

  return (
    <article
      className={cn(
        "group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-colors hover:border-white/15",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
        <Image
          src={url}
          alt={room?.name ?? "Booked room"}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          onError={() => {
            setUrl(FALLBACK_ROOM_IMAGE);
          }}
          loading="eager"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <div
          className={cn(
            "absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 via-black/20 to-transparent",
            compact ? "p-3" : "p-4",
          )}
        >
          {room ? (
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-1 rounded-full"
                style={{ backgroundColor: room.levelColor }}
              />
              <span className="text-[11px] font-medium tracking-[0.15em] text-white/90">
                LEVEL {room.level}
              </span>
            </div>
          ) : (
            <span />
          )}

          <BookingStatusBadge status={status} />
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-3 p-3" : "gap-4 p-4",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-medium text-white",
              compact ? "text-sm" : "text-base",
            )}
          >
            {room?.name ?? "Room"}
          </h3>

          <div className="flex shrink-0 items-center gap-1.5 text-zinc-400">
            <Users className="size-3.5" />
            <span className="text-xs">{guests}</span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-start gap-2 text-zinc-400",
            compact ? "text-xs" : "text-sm",
          )}
        >
          <CalendarRange className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p>
            {formatShortDateForDisplay(checkInDate)} →{" "}
            {formatShortDateForDisplay(checkOutDate)}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 pt-3">
          <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
            Total
          </span>
          <span className="font-medium text-emerald-300">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>
      {isCancellable ? (
        <div
          className={cn(
            "mt-auto flex gap-2",
            compact ? "m-3 mt-0" : "m-4 mt-0",
          )}
        >
          <Button
            type="button"
            size={compact ? "sm" : "lg"}
            variant="outline"
            disabled={!canModify}
            className={cn(
              "min-w-10 flex-1 gap-2 border-white/10 bg-transparent font-medium text-zinc-100 hover:bg-white/5 hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "h-8 text-xs" : "h-11 text-base",
            )}
            onClick={handleModifyBooking}
          >
            <Pencil className="size-4" />
            {compact ? "" : "Modify"}
          </Button>
          <Button
            type="button"
            size={compact ? "sm" : "lg"}
            disabled={!canCancel}
            className={cn(
              "min-w-10 flex-1 gap-2 bg-emerald-500 font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              compact ? "h-8 text-xs" : "h-11 text-base",
            )}
            onClick={handleCancelBooking}
          >
            {compact ? (
              <CalendarX2 className="size-4" />
            ) : (
              <CalendarCheck className="size-4" />
            )}
            {compact ? "" : "Cancel"}
          </Button>
        </div>
      ) : null}
    </article>
  );
};
