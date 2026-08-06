import { BOOKING_STAY_PROMPT_PREFIX } from "@repo/constants";

/**
 * Parses `[book-stay] roomId: … checkInDate: … checkOutDate: … guests: …`.
 */
export const parseBookStayMessage = (
  message: string,
): {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
} | null => {
  const text = message.trim();
  if (!text.startsWith(BOOKING_STAY_PROMPT_PREFIX)) {
    return null;
  }

  const roomId = /(?:^|\s)roomId:\s*([^\s.]+)/i.exec(text)?.[1]?.trim();
  const checkInDate = /(?:^|\s)checkInDate:\s*(\S+?)(?:\.|\s|$)/i
    .exec(text)?.[1]
    ?.replace(/\.$/, "")
    .trim();
  const checkOutDate = /(?:^|\s)checkOutDate:\s*(\S+?)(?:\.|\s|$)/i
    .exec(text)?.[1]
    ?.replace(/\.$/, "")
    .trim();
  const guestsRaw = /(?:^|\s)guests:\s*(\d+)/i.exec(text)?.[1];
  const guests = guestsRaw ? Number(guestsRaw) : NaN;

  if (
    !roomId ||
    !checkInDate ||
    !checkOutDate ||
    !Number.isInteger(guests) ||
    guests <= 0
  ) {
    return null;
  }

  return { roomId, checkInDate, checkOutDate, guests };
};
