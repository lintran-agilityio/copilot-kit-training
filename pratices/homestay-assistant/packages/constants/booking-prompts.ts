export const BOOKING_CANCEL_PROMPT_PREFIX = "[booking-cancel]";
export const BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX = "[booking-cancel-confirm]";
export const BOOKING_MODIFY_PROMPT_PREFIX = "[booking-modify]";
/** UI: open RoomDetail booking form in chat (no availability yet). */
export const BOOKING_FORM_PROMPT_PREFIX = "[book-form]";
/** UI: submit dates/guests — full create-booking tool chain. */
export const BOOKING_STAY_PROMPT_PREFIX = "[book-stay]";

/** Separates guest-facing copy from agent-only booking metadata in cancel prompts. */
export const BOOKING_CANCEL_METADATA_SEPARATOR = " || ";

export const isBookingCancelPrompt = (content: string) =>
  content.startsWith(BOOKING_CANCEL_PROMPT_PREFIX) &&
  !content.startsWith(BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX);

export const isBookingModifyPrompt = (content: string) =>
  content.startsWith(BOOKING_MODIFY_PROMPT_PREFIX);

export const isBookingFormPrompt = (content: string) =>
  content.startsWith(BOOKING_FORM_PROMPT_PREFIX);

export const isBookingStayPrompt = (content: string) =>
  content.startsWith(BOOKING_STAY_PROMPT_PREFIX);

const BOOKING_ID_PREFIX = /^bookingId:\s*[^.]+\.\s*/;
const BOOKING_STAY_METADATA_PREFIX =
  /^roomId:\s*[^.]+\.\s*checkInDate:\s*\S+\.\s*checkOutDate:\s*\S+\.\s*guests:\s*\d+\.\s*/i;

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

export const getBookingFormDisplayText = (content: string): string => {
  if (!isBookingFormPrompt(content)) {
    return content;
  }

  const withoutPrefix = content
    .slice(BOOKING_FORM_PROMPT_PREFIX.length)
    .trimStart();
  const withoutRoomId = withoutPrefix.replace(
    /\.\s*roomId:\s*[^.]+\.?\s*$/i,
    "",
  );

  if (withoutRoomId.startsWith("Show booking form for ")) {
    const name = withoutRoomId
      .slice("Show booking form for ".length)
      .replace(/\.$/, "")
      .trim();
    return name ? `Book ${name}` : withoutRoomId.trim();
  }

  return withoutRoomId.trim();
};

export const getBookingStayDisplayText = (content: string): string => {
  if (!isBookingStayPrompt(content)) {
    return content;
  }

  const withoutPrefix = content
    .slice(BOOKING_STAY_PROMPT_PREFIX.length)
    .trimStart();

  return withoutPrefix.replace(BOOKING_STAY_METADATA_PREFIX, "").trim();
};
