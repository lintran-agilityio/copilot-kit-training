/**
 * Shared helpers to coerce tool payloads into known Mastra/zod output shapes.
 * Accepts object or JSON-string forms that arrive from step/message tool results.
 */
import { z } from "zod";

import {
  findBookingByIdOutputSchema,
  getBookingsOutputSchema,
  type FindBookingByIdOutput,
  type GetBookingsOutput,
} from "@/mastra/schemas/booking";
import {
  findRoomOutputSchema,
  getRoomDetailOutputSchema,
  type FindRoomOutput,
  type GetRoomDetailOutput,
} from "@/mastra/schemas/rooms";
import type { JsonValue } from "@/mastra/utils/json-value";
import { asRecord } from "@/mastra/utils/parse-json-record";

const coercePayload = (output: JsonValue | undefined): JsonValue | undefined =>
  asRecord(output) ?? output;

/** Minimal booking shape used by stop-after-mutation success checks. */
const bookingMutationPayloadSchema = z.object({
  id: z.string().min(1),
  status: z.string().optional(),
});

export type BookingMutationPayload = z.infer<
  typeof bookingMutationPayloadSchema
>;

export const parseGetBookingsOutput = (
  output: JsonValue | undefined,
): GetBookingsOutput | null => {
  const parsed = getBookingsOutputSchema.safeParse(coercePayload(output));
  return parsed.success ? parsed.data : null;
};

export const parseFindBookingByIdOutput = (
  output: JsonValue | undefined,
): FindBookingByIdOutput | null => {
  const parsed = findBookingByIdOutputSchema.safeParse(coercePayload(output));
  return parsed.success ? parsed.data : null;
};

export const parseFindRoomOutput = (
  output: JsonValue | undefined,
): FindRoomOutput | null => {
  const parsed = findRoomOutputSchema.safeParse(coercePayload(output));
  return parsed.success ? parsed.data : null;
};

export const parseGetRoomDetailOutput = (
  output: JsonValue | undefined,
): GetRoomDetailOutput | null => {
  const parsed = getRoomDetailOutputSchema.safeParse(coercePayload(output));
  return parsed.success ? parsed.data : null;
};

/**
 * Mutation tool results sometimes nest under `{ value: Booking }`.
 * Only requires `id` (+ optional status) so success detectors stay permissive.
 */
export const parseBookingMutationPayload = (
  output: JsonValue | undefined,
): BookingMutationPayload | null => {
  const record = asRecord(output);
  if (!record) {
    return null;
  }

  const nested = asRecord(record.value) ?? record;
  const parsed = bookingMutationPayloadSchema.safeParse(nested);
  return parsed.success ? parsed.data : null;
};
