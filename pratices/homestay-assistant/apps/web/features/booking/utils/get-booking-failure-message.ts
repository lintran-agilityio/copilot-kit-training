import { parseToolResult } from "@repo/utils";

import { getFailureMessage, MODEL_NAME } from "@/features/booking/constants";
import type {
  CancelBookingResult,
  CreateBookingResult,
  UpdateBookingResult,
} from "@/features/booking/types";

type BookingErrorShape = {
  message?: unknown;
  error?: unknown;
  reason?: unknown;
};

const readErrorField = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveFailureMessage = (
  result: unknown,
  fallback: string,
): string => {
  if (result == null) {
    return fallback;
  }

  if (typeof result === "string") {
    const parsed = parseToolResult<BookingErrorShape>(result);
    if (parsed && typeof parsed === "object") {
      return (
        readErrorField(parsed.message) ??
        readErrorField(parsed.error) ??
        readErrorField(parsed.reason) ??
        fallback
      );
    }

    const trimmed = result.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  const shape = result as BookingErrorShape;
  return (
    readErrorField(shape.message) ??
    readErrorField(shape.error) ??
    readErrorField(shape.reason) ??
    fallback
  );
};

/** Guest-facing reason when create_booking completes without a success payload. */
export const getCreateBookingFailureMessage = (
  result?: CreateBookingResult | string | null,
): string =>
  resolveFailureMessage(result, getFailureMessage(MODEL_NAME.CREATE));

/** Guest-facing reason when cancel_booking completes without a success payload. */
export const getCancelBookingFailureMessage = (
  result?: CancelBookingResult | string | null,
): string =>
  resolveFailureMessage(result, getFailureMessage(MODEL_NAME.CANCEL));

/** Guest-facing reason when update_booking completes without a success payload. */
export const getModifyBookingFailureMessage = (
  result?: UpdateBookingResult | string | null,
): string =>
  resolveFailureMessage(result, getFailureMessage(MODEL_NAME.MODIFY));
