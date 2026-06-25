"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@repo/utils";

const ROOM_GALLERY_IMAGES: Record<string, string[]> = {
  meridian: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497215842964-222b430d1738?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
  ],
  "studio-north": [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
  ],
  "the-loft": [
    "https://images.unsplash.com/photo-1497215842964-222b430d1738?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
  ],
  observatory: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497215842964-222b430d1738?auto=format&fit=crop&w=600&q=80",
  ],
};

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
  const images = useMemo(() => {
    const gallery = imageUrls?.length
      ? imageUrls
      : (ROOM_GALLERY_IMAGES[roomId] ?? [imageUrl]);

    return gallery.includes(imageUrl) ? gallery : [imageUrl, ...gallery];
  }, [imageUrl, imageUrls, roomId]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? imageUrl;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={`${name} — photo ${activeIndex + 1}`}
          className="size-full object-cover transition-opacity duration-300"
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
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
