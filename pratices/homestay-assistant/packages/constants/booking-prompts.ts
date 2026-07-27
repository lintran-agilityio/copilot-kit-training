export const BOOKING_CANCEL_PROMPT_PREFIX = "[booking-cancel]";
export const BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX = "[booking-cancel-confirm]";
export const BOOKING_MODIFY_PROMPT_PREFIX = "[booking-modify]";

/** Separates guest-facing copy from agent-only booking metadata in cancel prompts. */
export const BOOKING_CANCEL_METADATA_SEPARATOR = " || ";

export const isBookingCancelPrompt = (content: string) =>
  content.startsWith(BOOKING_CANCEL_PROMPT_PREFIX) &&
  !content.startsWith(BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX);

export const isBookingModifyPrompt = (content: string) =>
  content.startsWith(BOOKING_MODIFY_PROMPT_PREFIX);

const BOOKING_ID_PREFIX = /^bookingId:\s*[^.]+\.\s*/;

export const getBookingCancelDisplayText = (content: string): string => {
  if (!isBookingCancelPrompt(content)) {
    return content;
  }

  const withoutPrefix = content
    .slice(BOOKING_CANCEL_PROMPT_PREFIX.length)
    .trimStart();
  const separatorIndex = withoutPrefix.indexOf(BOOKING_CANCEL_METADATA_SEPARATOR);
  const withoutBookingId = withoutPrefix.replace(BOOKING_ID_PREFIX, "");

  if (separatorIndex === -1) {
    return withoutBookingId.trim();
  }

  return withoutBookingId.slice(0, separatorIndex).trim();
};

export const getBookingModifyDisplayText = (content: string): string => {
  if (!isBookingModifyPrompt(content)) {
    return content;
  }

  const withoutPrefix = content
    .slice(BOOKING_MODIFY_PROMPT_PREFIX.length)
    .trimStart();

  return withoutPrefix.replace(BOOKING_ID_PREFIX, "").trim();
};
