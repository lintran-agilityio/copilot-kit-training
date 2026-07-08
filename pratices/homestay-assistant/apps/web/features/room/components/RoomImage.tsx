"use client";

import { cn } from "@repo/utils";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import {
  FALLBACK_ROOM_IMAGE,
  resolveRoomImage,
} from "@/features/room/utils/room-image";

type RoomImageProps = {
  imageUrl: string;
  name: string;
  level: number;
  levelColor: string;
  availableSlots: number;
  compact?: boolean;
};

export function RoomImage({
  imageUrl,
  name,
  level,
  levelColor,
  availableSlots,
  compact = false,
}: RoomImageProps) {
  const [url, setUrl] = useState<string | StaticImageData>(
    resolveRoomImage(imageUrl),
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-900",
        compact ? "aspect-[16/10]" : "aspect-[4/3]",
      )}
    >
      <Image
        src={url}
        alt={name}
        fill
        sizes={compact ? "(max-width: 768px) 100vw, 384px" : "(max-width: 768px) 100vw, 300px"}
        onError={() => {
          setUrl(FALLBACK_ROOM_IMAGE);
        }}
        priority
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-1 rounded-full"
            style={{ backgroundColor: levelColor }}
          />
          <span className="text-[11px] font-medium tracking-[0.15em] text-white/90">
            LEVEL {level}
          </span>
        </div>

        <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-medium text-black">
          {availableSlots} free
        </span>
      </div>
    </div>
  );
}
