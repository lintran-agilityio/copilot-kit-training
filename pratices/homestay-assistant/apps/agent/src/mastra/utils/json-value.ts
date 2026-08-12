/**
 * JSON-serializable value union for tool args/results before per-tool schema parse.
 * Prefer this over `unknown` for normalized step/message shells.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

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
    const record: { [key: string]: JsonValue } = {};
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
