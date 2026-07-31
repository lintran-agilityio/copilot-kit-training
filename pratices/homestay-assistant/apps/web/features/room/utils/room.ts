import type { FindRoomResult } from "@/features/room/types";
import { DEFAULT_ROOM_GALLERY_IMAGES } from "@/mocks/room";
import { StaticImageData } from "next/image";

/**
 * Builds a short heading for findRoom chat results from applied filters.
 *
 * @param result - Parsed findRoom tool output
 * @returns Heading text for the room preview list
 */
export const buildFindRoomTitle = (result: FindRoomResult): string => {
  const parts: string[] = [];

  if (result.name?.trim()) {
    parts.push(`“${result.name.trim()}”`);
  }
  if (result.date?.trim()) {
    parts.push(result.date.trim());
  }
  if (typeof result.guests === "number") {
    parts.push(`${result.guests} guests`);
  }
  if (typeof result.level === "number") {
    parts.push(`level ${result.level}`);
  }

  if (parts.length === 0) {
    return "Room results";
  }

  return `Rooms · ${parts.join(" · ")}`;
};

export const FALLBACK_ROOM_IMAGE = DEFAULT_ROOM_GALLERY_IMAGES[0]!;

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["images.unsplash.com"]);

export const resolveRoomImage = (
  src: string | StaticImageData | null | undefined
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

