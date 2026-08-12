/**
 * Narrows a JSON-like value to a plain object record.
 * Accepts objects or JSON strings that parse to non-array objects.
 *
 * @param value - Raw tool input/output or field
 * @returns Record when parseable, otherwise null
 */
export const asRecord = (
  value: unknown,
): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};
