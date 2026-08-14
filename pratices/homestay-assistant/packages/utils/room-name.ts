const normalizeRoomName = (name: string) => name.trim().toLowerCase();

/** Filler words guests type around a room name in cancel/book chat. */
const ROOM_NAME_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "book",
  "booking",
  "bookings",
  "can",
  "cancel",
  "cancelled",
  "cancellation",
  "change",
  "checkout",
  "checkin",
  "check",
  "could",
  "date",
  "dates",
  "extend",
  "for",
  "gimme",
  "gonna",
  "got",
  "gotta",
  "guest",
  "guests",
  "hello",
  "hey",
  "hi",
  "i",
  "id",
  "im",
  "in",
  "is",
  "just",
  "kindly",
  "lemme",
  "like",
  "ll",
  "may",
  "me",
  "might",
  "modify",
  "my",
  "need",
  "needed",
  "needs",
  "number",
  "of",
  "out",
  "plaese",
  "please",
  "plz",
  "pls",
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
  "wan",
  "wanna",
  "want",
  "wanted",
  "wants",
  "would",
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
