/**
 * Coerces a value into a positive integer (e.g. guests, capacity).
 *
 * @param value - Raw numeric field from a tool result
 * @returns Positive integer, or undefined when invalid
 */
export const asPositiveInt = (value: unknown): number | undefined => {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return undefined;
  }

  return n;
};

/**
 * Coerces a value into a non-empty trimmed string.
 *
 * @param value - Raw field from a tool result or message
 * @returns Trimmed string, or undefined when missing/blank
 */
export const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};