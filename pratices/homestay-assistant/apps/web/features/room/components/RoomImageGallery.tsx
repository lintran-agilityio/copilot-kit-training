"use client";

import { useMemo, useState } from "react";
import Image, { StaticImageData } from "next/image";

import { cn } from "@repo/utils";
import {
  DEFAULT_ROOM_GALLERY_IMAGES,
  ROOM_GALLERY_IMAGES,
} from "@/mocking/room";
import defaultRoomImage from "@/images/bed_room.jpg";

type RoomImageGalleryProps = {
  roomId: string;
  imageUrl: string;
  name: string;
  level: number;
  levelColor: string;
  availableSlots: number;
  imageUrls?: string[];
};

export const RoomImageGallery = ({
  roomId,
  imageUrl,
  name,
  level,
  levelColor,
  availableSlots,
  imageUrls,
}: RoomImageGalleryProps) => {
  const [url, setUrl] = useState<string | StaticImageData>(imageUrl);
  const images = useMemo(() => {
    const gallery = imageUrls?.length
      ? imageUrls
      : (ROOM_GALLERY_IMAGES[roomId] ?? DEFAULT_ROOM_GALLERY_IMAGES);

    return gallery.includes(imageUrl) ? gallery : [imageUrl, ...gallery];
  }, [imageUrl, imageUrls, roomId]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? url;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        <Image
          src={activeImage}
          alt={`${name} — photo ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          onError={() => {
            setUrl(defaultRoomImage);
          }}
          loading="lazy"
          className="object-cover transition-opacity duration-300"
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

      {images.length > 1 ? (
        <div className="app-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              aria-label={`View image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === activeIndex
                  ? "border-emerald-400"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={url}
                alt={`${name} thumbnail ${index + 1}`}
                width={80}
                height={80}
                sizes="(max-width: 768px) 100vw, 80px"
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
