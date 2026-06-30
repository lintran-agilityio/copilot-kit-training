"use client";

import { CalendarRange, Users } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import type { BookingResponse } from "@/features/booking/types/booking";
import { formatBookingDate } from "@/features/booking/utils/booking-status";
import { DEFAULT_ROOM_GALLERY_IMAGES } from "@/mocking/room";
import { cn, formatPrice } from "@repo/utils";

const FALLBACK_ROOM_IMAGE = DEFAULT_ROOM_GALLERY_IMAGES[0]!;

type BookingCardProps = {
  booking: BookingResponse;
  className?: string;
};

export const BookingCard = ({ booking, className }: BookingCardProps) => {
  const room = booking.room;
  const imageUrl = room?.imageUrl ?? "";
  const [url, setUrl] = useState<string | StaticImageData>(
    imageUrl || FALLBACK_ROOM_IMAGE,
  );

  return (
    <article
      className={cn(
        "group min-w-[280px] max-w-[340px] flex-1 overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-colors hover:border-white/15",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
        <Image
          src={url}
          alt={room?.name ?? "Booked room"}
          fill
          sizes="(max-width: 768px) 100vw, 340px"
          onError={() => {
            setUrl(FALLBACK_ROOM_IMAGE);
          }}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 via-black/20 to-transparent p-4">
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

          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium text-white">
            {room?.name ?? "Room"}
          </h3>

          <div className="flex shrink-0 items-center gap-1.5 text-zinc-400">
            <Users className="size-3.5" />
            <span className="text-xs">{booking.guests}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-zinc-400">
          <CalendarRange className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p>
            {formatBookingDate(booking.checkInDate)} →{" "}
            {formatBookingDate(booking.checkOutDate)}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 pt-3">
          <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
            Total
          </span>
          <span className="font-medium text-emerald-300">
            {formatPrice(booking.totalPrice)}
          </span>
        </div>
      </div>
    </article>
  );
};
