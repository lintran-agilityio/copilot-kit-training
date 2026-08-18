import { asJsonValue, isJsonObject } from "./json-value";
import type { JsonObject, JsonValue } from "./json-value";

/**
 * Narrows a JSON-like value to a plain object record.
 * Accepts objects or JSON strings that parse to non-array objects.
 *
 * @param value - Raw tool input/output or field
 * @returns Record when parseable, otherwise null
 */
export const asRecord = (
  value: JsonValue | undefined | null,
): JsonObject | null => {
  if (isJsonObject(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = asJsonValue(JSON.parse(value));
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
