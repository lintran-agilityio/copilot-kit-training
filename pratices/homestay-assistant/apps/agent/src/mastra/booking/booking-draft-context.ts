import type { RequestContext } from "@mastra/core/request-context";

import {
  BOOKING_DRAFT_MODE,
  BOOKING_DRAFT_STATUS,
  bookingDraftSchema,
  getMissingBookingFields,
  resolveBookingDraftStatus,
  type BookingDraft,
  type BookingDraftMode,
  type BookingDraftStatus,
} from "@repo/schemas/booking-draft";

import {
  mergeCreateBookingDraft,
  type CreateBookingDraftPartial,
  type MergeCreateBookingDraftInput,
  type StructuredSearchContext,
} from "./create-booking-draft.ts";
import { REQUEST_CONTEXT_KEYS } from "../middleware/constants.ts";

export type { StructuredSearchContext };

type DraftStayFields = Pick<
  BookingDraft,
  "roomId" | "roomName" | "checkInDate" | "checkOutDate" | "guests"
>;

const toPartialFromDraft = (
  draft: BookingDraft | null,
): CreateBookingDraftPartial | undefined => {
  if (!draft) {
    return undefined;
  }

  return {
    roomId: draft.roomId ?? null,
    roomName: draft.roomName ?? null,
    checkInDate: draft.checkInDate ?? null,
    checkOutDate: draft.checkOutDate ?? null,
    guests: draft.guests ?? null,
  };
};

/**
 * Parses and validates a Booking Draft from unknown storage (request context /
 * thread metadata). Returns null when absent or malformed.
 */
export const parseBookingDraft = (value: unknown): BookingDraft | null => {
  const parsed = bookingDraftSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/**
 * Reads the authoritative Booking Draft from request context.
 */
export const readBookingDraft = (
  requestContext: RequestContext | undefined,
): BookingDraft | null => {
  if (!requestContext) {
    return null;
  }

  return parseBookingDraft(
    requestContext.get(REQUEST_CONTEXT_KEYS.BOOKING_DRAFT),
  );
};

/**
 * Writes the Booking Draft into request context (single authoritative copy).
 */
export const writeBookingDraft = (
  requestContext: RequestContext | undefined,
  draft: BookingDraft,
): BookingDraft => {
  const validated = bookingDraftSchema.parse(draft);
  requestContext?.set(REQUEST_CONTEXT_KEYS.BOOKING_DRAFT, validated);
  return validated;
};

/**
 * Clears the Booking Draft after completion, cancellation, or explicit reset.
 */
export const clearBookingDraft = (
  requestContext: RequestContext | undefined,
) => {
  requestContext?.set(REQUEST_CONTEXT_KEYS.BOOKING_DRAFT, undefined);
};

export const readStructuredSearchContext = (
  requestContext: RequestContext | undefined,
): StructuredSearchContext | null => {
  if (!requestContext) {
    return null;
  }

  const value = requestContext.get(
    REQUEST_CONTEXT_KEYS.STRUCTURED_SEARCH_CONTEXT,
  );

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const date =
    typeof record.date === "string" && record.date.trim()
      ? record.date.trim()
      : null;
  const guests =
    typeof record.guests === "number" &&
    Number.isInteger(record.guests) &&
    record.guests > 0
      ? record.guests
      : null;

  if (!date && guests == null) {
    return null;
  }

  return { date, guests };
};

/**
 * Stores last find_room filters only — never a competing booking stay copy.
 */
export const writeStructuredSearchContext = (
  requestContext: RequestContext | undefined,
  search: StructuredSearchContext,
) => {
  const next: StructuredSearchContext = {
    date: search.date?.trim() || null,
    guests:
      typeof search.guests === "number" &&
      Number.isInteger(search.guests) &&
      search.guests > 0
        ? search.guests
        : null,
  };

  if (!next.date && next.guests == null) {
    requestContext?.set(
      REQUEST_CONTEXT_KEYS.STRUCTURED_SEARCH_CONTEXT,
      undefined,
    );
    return;
  }

  requestContext?.set(REQUEST_CONTEXT_KEYS.STRUCTURED_SEARCH_CONTEXT, next);
};

export const clearStructuredSearchContext = (
  requestContext: RequestContext | undefined,
) => {
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.STRUCTURED_SEARCH_CONTEXT,
    undefined,
  );
};

const resolveNextStatus = (
  existing: BookingDraft | null,
  fields: DraftStayFields,
): BookingDraftStatus => {
  const completeness = resolveBookingDraftStatus(fields);

  if (completeness === BOOKING_DRAFT_STATUS.INCOMPLETE) {
    return BOOKING_DRAFT_STATUS.INCOMPLETE;
  }

  // Do not regress past availability/confirm once the stay is still complete.
  if (
    existing?.status === BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM ||
    existing?.status === BOOKING_DRAFT_STATUS.CONFIRMED
  ) {
    return existing.status;
  }

  return BOOKING_DRAFT_STATUS.READY_FOR_AVAILABILITY;
};

export type ApplyMergeToBookingDraftInput = Omit<
  MergeCreateBookingDraftInput,
  "draft" | "structuredSearchContext"
> & {
  mode?: BookingDraftMode;
  bookingId?: string;
  requestedTime?: string | null;
  room?: BookingDraft["room"];
  /** Override — defaults to request-context structured search. */
  structuredSearchContext?: StructuredSearchContext | null;
};

/**
 * Progressively updates the same Booking Draft in request context.
 * Existing draft fields are the `draft` merge source; never invents guests.
 */
export const applyMergeToBookingDraft = (
  requestContext: RequestContext | undefined,
  input: ApplyMergeToBookingDraftInput,
): BookingDraft => {
  const existing = readBookingDraft(requestContext);
  const structuredSearchContext =
    input.structuredSearchContext === undefined
      ? readStructuredSearchContext(requestContext)
      : input.structuredSearchContext;

  const merged = mergeCreateBookingDraft({
    user: input.user,
    ui: input.ui,
    draft: toPartialFromDraft(existing),
    structuredBookingContext: input.structuredBookingContext,
    structuredSearchContext: structuredSearchContext ?? undefined,
    defaults: input.defaults,
  });

  const fields: DraftStayFields = {
    roomId: merged.draft.roomId,
    roomName: merged.draft.roomName,
    checkInDate: merged.draft.checkInDate,
    checkOutDate: merged.draft.checkOutDate,
    guests: merged.draft.guests,
  };

  const mode = input.mode ?? existing?.mode ?? BOOKING_DRAFT_MODE.CREATE;
  const bookingId =
    mode === BOOKING_DRAFT_MODE.MODIFY
      ? (input.bookingId?.trim() || existing?.bookingId)
      : undefined;

  const next: BookingDraft = {
    mode,
    status: resolveNextStatus(existing, fields),
    ...(bookingId ? { bookingId } : {}),
    roomId: fields.roomId,
    roomName: fields.roomName,
    checkInDate: fields.checkInDate,
    checkOutDate: fields.checkOutDate,
    guests: fields.guests,
    missingFields: merged.missingFields,
    requestedTime:
      input.requestedTime !== undefined
        ? input.requestedTime
        : (existing?.requestedTime ?? null),
    provenance: {
      roomId: merged.provenanced.roomId,
      roomName: merged.provenanced.roomName,
      checkInDate: merged.provenanced.checkInDate,
      checkOutDate: merged.provenanced.checkOutDate,
      guests: merged.provenanced.guests,
    },
    ...(input.room
      ? { room: input.room }
      : existing?.room
        ? { room: existing.room }
        : {}),
  };

  return writeBookingDraft(requestContext, next);
};

/**
 * Creates a Booking Draft on first booking intent when none exists yet.
 */
export const ensureBookingDraft = (
  requestContext: RequestContext | undefined,
  input: ApplyMergeToBookingDraftInput,
): BookingDraft => {
  const existing = readBookingDraft(requestContext);
  if (existing) {
    return applyMergeToBookingDraft(requestContext, input);
  }

  return applyMergeToBookingDraft(requestContext, input);
};

export const setBookingDraftStatus = (
  requestContext: RequestContext | undefined,
  status: BookingDraftStatus,
): BookingDraft | null => {
  const existing = readBookingDraft(requestContext);
  if (!existing) {
    return null;
  }

  return writeBookingDraft(requestContext, { ...existing, status });
};

/**
 * Stay fields for availability / create — only when the draft is complete enough.
 * Returns null when the draft is missing or incomplete (caller must not invent).
 */
export const readBookingDraftStayForAvailability = (
  requestContext: RequestContext | undefined,
): {
  mode: BookingDraftMode;
  bookingId?: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
} | null => {
  const draft = readBookingDraft(requestContext);
  if (!draft) {
    return null;
  }

  if (getMissingBookingFields(draft).length > 0) {
    return null;
  }

  const roomId = draft.roomId?.trim();
  const checkInDate = draft.checkInDate?.trim();
  const checkOutDate = draft.checkOutDate?.trim();
  const guests = draft.guests;

  if (!roomId || !checkInDate || !checkOutDate || guests == null) {
    return null;
  }

  return {
    mode: draft.mode,
    ...(draft.bookingId ? { bookingId: draft.bookingId } : {}),
    roomId,
    checkInDate,
    checkOutDate,
    guests,
  };
};

/**
 * Clears booking workflow state after terminal create/update/cancel/reset.
 * Does not clear unrelated PENDING_* HITL pins still needed mid-hop.
 */
export const clearBookingWorkflowDraftState = (
  requestContext: RequestContext | undefined,
) => {
  clearBookingDraft(requestContext);
  clearStructuredSearchContext(requestContext);
};
