export const BOOKING_CANCEL_PROMPT_PREFIX = "[booking-cancel]";

export const BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX = "[booking-cancel-confirm]";



/** Separates guest-facing copy from agent-only booking metadata in cancel prompts. */

export const BOOKING_CANCEL_METADATA_SEPARATOR = " || ";



export type BookingCancelMetadata = {

  bookingId: string;

  roomName: string;

  checkInDate: string;

  checkOutDate: string;

  guests: number;

  totalPrice: number;

};



export const isBookingCancelPrompt = (content: string) =>

  content.startsWith(BOOKING_CANCEL_PROMPT_PREFIX) &&

  !content.startsWith(BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX);



export const isBookingCancelConfirmPrompt = (content: string) =>

  content.startsWith(BOOKING_CANCEL_CONFIRM_PROMPT_PREFIX);



export const buildBookingCancelMetadata = (metadata: BookingCancelMetadata) =>

  (Object.entries(metadata) as [keyof BookingCancelMetadata, string | number][])

    .map(([key, value]) => `${key}: ${value}`)

    .join(". ") + ".";



const BOOKING_CANCEL_BOOKING_ID_PREFIX = /^bookingId:\s*[^.]+\.\s*/;



export const getBookingCancelDisplayText = (content: string): string => {

  if (!isBookingCancelPrompt(content)) {

    return content;

  }



  const withoutPrefix = content

    .slice(BOOKING_CANCEL_PROMPT_PREFIX.length)

    .trimStart();

  const separatorIndex = withoutPrefix.indexOf(BOOKING_CANCEL_METADATA_SEPARATOR);



  const withoutBookingId = withoutPrefix.replace(

    BOOKING_CANCEL_BOOKING_ID_PREFIX,

    "",

  );



  if (separatorIndex === -1) {

    return withoutBookingId.trim();

  }



  return withoutBookingId.slice(0, separatorIndex).trim();

};


