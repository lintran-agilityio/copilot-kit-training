const normalizeRoomName = (name: string) => name.trim().toLowerCase();

/** Filler words guests type around a room name in cancel/book chat. */
const ROOM_NAME_STOP_WORDS = new Set([
  "a",
  "all",
  "an",
  "and",
  "any",
  "at",
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
  "gona",
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
  "it",
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
  "on",
  "one",
  "ones",
  "or",
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
  "some",
  "stay",
  "the",
  "their",
  "them",
  "these",
  "this",
  "that",
  "those",
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
 *
 * When every token is filler (e.g. "cancel one of my bookings"), the guest
 * named no room at all — return "" rather than falling back to the raw
 * sentence, which would otherwise become a bogus room-name filter that
 * matches no real room and hides every active booking.
 */
export const extractRoomNameQuery = (raw: string) => {
  const tokens = tokenize(raw);
  const kept = tokens.filter((token) => !ROOM_NAME_STOP_WORDS.has(token));

  return kept.join(" ");
};

/**
 * Fuzzy room-name match for cancel/find flows.
 * Handles filler ("room", "booking") and missing leading "The".
 *
 * Several real room names end in a filler word ("Misty Pavilion Room",
 * "Lotus Garden Room"). Callers often pass an already-cleaned query (e.g.
 * cancel/modify pins store extractRoomNameQuery(text), stripped of "room"),
 * so the room name must be cleaned the same way — otherwise a query that
 * lost its trailing "room" can no longer substring-match a room name that
 * still has it.
 */
export const matchesRoomName = (roomName: string, query: string) => {
  const room = normalizeRoomName(roomName);
  const cleanedRoom = extractRoomNameQuery(roomName);
  const rawQuery = normalizeRoomName(query);
  const cleanedQuery = extractRoomNameQuery(query);

  if (!room || (!rawQuery && !cleanedQuery)) {
    return false;
  }

  const roomCandidates = [room, cleanedRoom].filter((value) => value.length > 0);
  const queryCandidates = [rawQuery, cleanedQuery].filter((value) => value.length > 0);

  if (
    roomCandidates.some((r) =>
      queryCandidates.some((q) => r === q || r.includes(q) || q.includes(r)),
    )
  ) {
    return true;
  }

  const roomTokens = tokenize(cleanedRoom || room);
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
