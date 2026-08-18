/**
 * JSON-serializable value union for tool args/results before per-tool schema parse.
 * Prefer this over `unknown` for normalized step/message shells.
 */
export type JsonObject = { [key: string]: JsonValue };

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

/**
 * Narrows a value to JsonValue when it is JSON-serializable; otherwise undefined.
 */
export const asJsonValue = (value: unknown): JsonValue | undefined => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    const items: JsonValue[] = [];
    for (const item of value) {
      const parsed = asJsonValue(item);
      if (parsed === undefined) {
        return undefined;
      }
      items.push(parsed);
    }
    return items;
  }

  if (value && typeof value === "object") {
    const record: JsonObject = {};
    for (const [key, entry] of Object.entries(value)) {
      const parsed = asJsonValue(entry);
      if (parsed === undefined) {
        return undefined;
      }
      record[key] = parsed;
    }
    return record;
  }

  return undefined;
};

export const isJsonObject = (
  value: JsonValue | undefined | null,
): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Narrows a JSON value to a plain object. Also accepts a JSON-string object,
 * matching the string form that sometimes arrives on tool results.
 */
export const asJsonObject = (
  value: JsonValue | undefined | null,
): JsonObject | null => {
  if (isJsonObject(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    const jsonValue = asJsonValue(parsed);
    return isJsonObject(jsonValue) ? jsonValue : null;
  } catch {
    return null;
  }
};
