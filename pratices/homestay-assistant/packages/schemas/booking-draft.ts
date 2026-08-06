import { z } from "zod";

import { roomSchema } from "./room.js";

/** Create vs modify — one draft schema for both booking flows. */
export const BOOKING_DRAFT_MODE = {
  CREATE: "CREATE",
  MODIFY: "MODIFY",
} as const;

export type BookingDraftMode =
  (typeof BOOKING_DRAFT_MODE)[keyof typeof BOOKING_DRAFT_MODE];

/**
 * Workflow status for step-machine routing (not LLM-owned).
 * INCOMPLETE → Draft HITL; READY_FOR_AVAILABILITY → check availability;
 * READY_FOR_CONFIRM → confirm HITL; CONFIRMED → create/update.
 */
export const BOOKING_DRAFT_STATUS = {
  INCOMPLETE: "INCOMPLETE",
  READY_FOR_AVAILABILITY: "READY_FOR_AVAILABILITY",
  READY_FOR_CONFIRM: "READY_FOR_CONFIRM",
  CONFIRMED: "CONFIRMED",
} as const;

export type BookingDraftStatus =
  (typeof BOOKING_DRAFT_STATUS)[keyof typeof BOOKING_DRAFT_STATUS];

export const DRAFT_FIELD_SOURCE = {
  USER: "user",
  UI: "ui",
  DRAFT: "draft",
  STRUCTURED_BOOKING_CONTEXT: "structured-booking-context",
  STRUCTURED_SEARCH_CONTEXT: "structured-search-context",
  DEFAULT: "default",
} as const;

export type DraftFieldSource =
  (typeof DRAFT_FIELD_SOURCE)[keyof typeof DRAFT_FIELD_SOURCE];

export const BOOKING_DRAFT_MISSING_FIELD = {
  ROOM_ID: "roomId",
  CHECK_IN: "checkIn",
  CHECK_OUT: "checkOut",
  GUESTS: "guests",
} as const;

export type BookingDraftMissingField =
  (typeof BOOKING_DRAFT_MISSING_FIELD)[keyof typeof BOOKING_DRAFT_MISSING_FIELD];

export const bookingDraftModeSchema = z.enum([
  BOOKING_DRAFT_MODE.CREATE,
  BOOKING_DRAFT_MODE.MODIFY,
]);

export const bookingDraftStatusSchema = z.enum([
  BOOKING_DRAFT_STATUS.INCOMPLETE,
  BOOKING_DRAFT_STATUS.READY_FOR_AVAILABILITY,
  BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM,
  BOOKING_DRAFT_STATUS.CONFIRMED,
]);

export const draftFieldSourceSchema = z.enum([
  DRAFT_FIELD_SOURCE.USER,
  DRAFT_FIELD_SOURCE.UI,
  DRAFT_FIELD_SOURCE.DRAFT,
  DRAFT_FIELD_SOURCE.STRUCTURED_BOOKING_CONTEXT,
  DRAFT_FIELD_SOURCE.STRUCTURED_SEARCH_CONTEXT,
  DRAFT_FIELD_SOURCE.DEFAULT,
]);

export const bookingDraftMissingFieldSchema = z.enum([
  BOOKING_DRAFT_MISSING_FIELD.ROOM_ID,
  BOOKING_DRAFT_MISSING_FIELD.CHECK_IN,
  BOOKING_DRAFT_MISSING_FIELD.CHECK_OUT,
  BOOKING_DRAFT_MISSING_FIELD.GUESTS,
]);

export const provenancedStringSchema = z.object({
  value: z.string(),
  source: draftFieldSourceSchema,
});

export const provenancedNumberSchema = z.object({
  value: z.number().int().positive(),
  source: draftFieldSourceSchema,
});

/**
 * Reusable booking draft — create and modify.
 * No pricing. Time is optional conversational metadata only.
 */
export const bookingDraftSchema = z
  .object({
    mode: bookingDraftModeSchema.describe(
      "CREATE for a new stay; MODIFY for an existing booking",
    ),
    status: bookingDraftStatusSchema.describe(
      "Step-machine routing status — not inferred from chat prose",
    ),
    bookingId: z
      .string()
      .optional()
      .describe("Required when mode is MODIFY — never a roomId"),
    roomId: z.string().nullable().optional(),
    roomName: z.string().nullable().optional(),
    room: roomSchema
      .optional()
      .describe("Full room for Draft HITL display when already resolved"),
    checkInDate: z
      .string()
      .nullable()
      .optional()
      .describe("Check-in date YYYY-MM-DD — date-only"),
    checkOutDate: z
      .string()
      .nullable()
      .optional()
      .describe("Check-out date YYYY-MM-DD — date-only"),
    guests: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe("Explicit guest count only — never invent 1"),
    missingFields: z
      .array(bookingDraftMissingFieldSchema)
      .describe("Deterministic gaps for Draft HITL / step machine"),
    /**
     * Wall-clock time from the guest message (e.g. "20:00").
     * Conversational metadata only — ignored by availability and persistence.
     */
    requestedTime: z.string().nullable().optional(),
    provenance: z
      .object({
        roomId: provenancedStringSchema.nullable().optional(),
        roomName: provenancedStringSchema.nullable().optional(),
        checkInDate: provenancedStringSchema.nullable().optional(),
        checkOutDate: provenancedStringSchema.nullable().optional(),
        guests: provenancedNumberSchema.nullable().optional(),
      })
      .optional()
      .describe("Optional field provenance for debugging / merge audits"),
  })
  .superRefine((draft, ctx) => {
    if (draft.mode === BOOKING_DRAFT_MODE.MODIFY && !draft.bookingId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bookingId is required when mode is MODIFY",
        path: ["bookingId"],
      });
    }
  });

export type BookingDraft = z.infer<typeof bookingDraftSchema>;

/** HITL params — same reusable draft shape. */
export const bookingDraftHitlSchema = bookingDraftSchema;

export type BookingDraftArgs = BookingDraft;

export type BookingDraftResult =
  | { confirmed: false }
  | {
      confirmed: true;
      mode: BookingDraftMode;
      bookingId?: string;
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
    };

type BookingDraftFieldInput = {
  roomId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  guests?: number | null;
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asPositiveInt = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

/**
 * Deterministic missing fields for HITL renderers and the step machine.
 * Callers should not manually inspect every draft property.
 */
export const getMissingBookingFields = (
  draft: BookingDraftFieldInput,
): BookingDraftMissingField[] => {
  const missingFields: BookingDraftMissingField[] = [];

  if (!asNonEmptyString(draft.roomId)) {
    missingFields.push(BOOKING_DRAFT_MISSING_FIELD.ROOM_ID);
  }
  if (!asNonEmptyString(draft.checkInDate)) {
    missingFields.push(BOOKING_DRAFT_MISSING_FIELD.CHECK_IN);
  }
  if (!asNonEmptyString(draft.checkOutDate)) {
    missingFields.push(BOOKING_DRAFT_MISSING_FIELD.CHECK_OUT);
  }
  if (asPositiveInt(draft.guests) == null) {
    missingFields.push(BOOKING_DRAFT_MISSING_FIELD.GUESTS);
  }

  return missingFields;
};

/**
 * Maps completeness to draft status for pre-availability routing.
 * Later statuses (READY_FOR_CONFIRM / CONFIRMED) are set by the step machine.
 */
export const resolveBookingDraftStatus = (
  draft: BookingDraftFieldInput,
): typeof BOOKING_DRAFT_STATUS.INCOMPLETE | typeof BOOKING_DRAFT_STATUS.READY_FOR_AVAILABILITY => {
  const missingFields = getMissingBookingFields(draft);
  return missingFields.length === 0
    ? BOOKING_DRAFT_STATUS.READY_FOR_AVAILABILITY
    : BOOKING_DRAFT_STATUS.INCOMPLETE;
};
