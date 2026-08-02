/**
 * Parsed HITL stay payload used to override LLM tool args in booking flows.
 */
export type ConfirmedStay = {
  bookingId?: string;
  roomId?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

/**
 * Coerces an unknown value into a non-empty trimmed string.
 *
 * @param value - Raw field from a tool result
 * @returns Trimmed string, or undefined when missing/blank
 */
const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Coerces an unknown value into a positive guest count.
 *
 * @param value - Raw guests field from a tool result
 * @returns Positive integer, or undefined when invalid
 */
const asPositiveGuests = (value: unknown): number | undefined => {
  const guests = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(guests) || guests <= 0 || !Number.isInteger(guests)) {
    return undefined;
  }

  return guests;
};

/**
 * Parses a confirmed HITL stay from edit/confirm tool output.
 *
 * @param output - Tool result payload (object or JSON string)
 * @returns Confirmed stay fields, or null when the result is not usable
 */
export const parseConfirmedStay = (output: unknown): ConfirmedStay | null => {
  const result =
    output && typeof output === "object" && !Array.isArray(output)
      ? (output as Record<string, unknown>)
      : typeof output === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(output) as unknown;
              return parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
                ? (parsed as Record<string, unknown>)
                : null;
            } catch {
              return null;
            }
          })()
        : null;

  if (!result || result.confirmed !== true) {
    return null;
  }

  const checkInDate = asNonEmptyString(result.checkInDate);
  const checkOutDate = asNonEmptyString(result.checkOutDate);
  const guests = asPositiveGuests(result.guests);

  if (!checkInDate || !checkOutDate || guests == null) {
    return null;
  }

  return {
    bookingId: asNonEmptyString(result.bookingId),
    roomId: asNonEmptyString(result.roomId),
    checkInDate,
    checkOutDate,
    guests,
  };
};
