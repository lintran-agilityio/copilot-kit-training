import type { StaticImageData } from "next/image";

import { DEFAULT_ROOM_GALLERY_IMAGES } from "@/mocking/room";

export const FALLBACK_ROOM_IMAGE = DEFAULT_ROOM_GALLERY_IMAGES[0]!;

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["images.unsplash.com"]);

export const resolveRoomImage = (
  src: string | StaticImageData | null | undefined,
): string | StaticImageData => {
  if (!src) {
    return FALLBACK_ROOM_IMAGE;
  }

  if (typeof src !== "string") {
    return src;
  }

  if (src.startsWith("/")) {
    return src;
  }

  try {
    const url = new URL(src);

    if (
      url.protocol === "https:" &&
      ALLOWED_REMOTE_IMAGE_HOSTS.has(url.hostname)
    ) {
      return src;
    }
  } catch {
    return FALLBACK_ROOM_IMAGE;
  }

  return FALLBACK_ROOM_IMAGE;
};
