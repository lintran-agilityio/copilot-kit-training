const normalizeRoomName = (name: string) => name.trim().toLowerCase();

/** Filler words guests type around a room name in cancel/book chat. */
const ROOM_NAME_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "book",
  "booking",
  "bookings",
  "cancel",
  "cancelled",
  "cancellation",
  "change",
  "checkout",
  "checkin",
  "check",
  "date",
  "dates",
  "extend",
  "for",
  "guest",
  "guests",
  "i",
  "in",
  "is",
  "me",
  "modify",
  "my",
  "number",
  "of",
  "out",
  "please",
  "reservation",
  "reservations",
  "room",
  "rooms",
  "shorten",
  "stay",
  "the",
  "this",
  "that",
  "to",
  "update",
  "want",
]);

const tokenize = (value: string) =>
  normalizeRoomName(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => Boolean(token) && !/^\d+$/.test(token));

/**
 * Strip cancel/booking filler from a free-text room mention.
 * "cancel The Meridian room booking" → "meridian"
 * "Orchid Twin Loft" → "orchid twin loft"
 */
export const extractRoomNameQuery = (raw: string) => {
  const tokens = tokenize(raw);
  const kept = tokens.filter((token) => !ROOM_NAME_STOP_WORDS.has(token));

  if (kept.length > 0) {
    return kept.join(" ");
  }

  return normalizeRoomName(raw);
};

/**
 * Fuzzy room-name match for cancel/find flows.
 * Handles filler ("room", "booking") and missing leading "The".
 */
export const matchesRoomName = (roomName: string, query: string) => {
  const room = normalizeRoomName(roomName);
  const rawQuery = normalizeRoomName(query);
  const cleanedQuery = extractRoomNameQuery(query);

  if (!room || (!rawQuery && !cleanedQuery)) {
    return false;
  }

  if (
    room === rawQuery ||
    room === cleanedQuery ||
    (rawQuery.length > 0 &&
      (room.includes(rawQuery) || rawQuery.includes(room))) ||
    (cleanedQuery.length > 0 &&
      (room.includes(cleanedQuery) || cleanedQuery.includes(room)))
  ) {
    return true;
  }

  const roomTokens = tokenize(room);
  const queryTokens = tokenize(cleanedQuery);

  if (queryTokens.length === 0) {
    return false;
  }

  const roomNameMatches = queryTokens.every((queryToken) =>
    roomTokens.some(
      (roomToken) =>
        roomToken === queryToken ||
        roomToken.includes(queryToken) ||
        queryToken.includes(roomToken),
    ),
  );
  return roomNameMatches;
};
