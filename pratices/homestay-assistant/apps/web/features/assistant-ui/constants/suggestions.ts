import { ChatSuggestion, ChatSuggestionState } from "../types";

export const CHAT_SUGGESTIONS = [
  { title: "Room for 4 people", message: "Find a room for 4 people today" },
  { title: "Need a quiet space", message: "I need a quiet space for focused work" },
  { title: "Rooms with video", message: "Show me rooms with video conferencing" },
  {
    title: "What's available today?",
    message: "What rooms are available today?",
  },
];

export const HOME_SUGGESTIONS = [
  {
    id: "available",
    label: "Available rooms",
    prompt: "Show available rooms",
  },
  {
    id: "luxury",
    label: "Luxury rooms",
    prompt: "Show luxury rooms",
  },
  {
    id: "bookings",
    label: "My bookings",
    prompt: "Show my bookings",
  },
];

export const ROOM_DETAIL_SUGGESTIONS = [
  {
    id: "book-room",
    label: "Book this room",
    prompt: "Book this room",
  },
  {
    id: "availability",
    label: "Check availability",
    prompt: "Check availability",
  },
];

export const BOOKING_SUCCESS_SUGGESTIONS = [
  {
    id: "view-bookings",
    label: "View my bookings",
    prompt: "Show my bookings",
  },
  {
    id: "browse",
    label: "Browse more rooms",
    prompt: "Show available rooms",
  },
];

export const BOOKING_FORM_SUGGESTIONS = [
  {
    id: "cancel-booking",
    label: "Cancel this booking",
    prompt: "Cancel this booking",
  },
  {
    id: "browse-rooms",
    label: "Browse rooms",
    prompt: "Show available rooms",
  },
];

export const BOOKINGS_PAGE_SUGGESTIONS = [
  {
    id: "cancel-booking",
    label: "Cancel a booking",
    prompt: "Cancel a booking",
  }
];

export const SUGGESTIONS_BY_STATE: Record<
  ChatSuggestionState,
  ChatSuggestion[]
> = {
  HOME: HOME_SUGGESTIONS,
  ROOM_DETAIL: ROOM_DETAIL_SUGGESTIONS,
  BOOKING_FORM: BOOKING_FORM_SUGGESTIONS,
  BOOKING_SUCCESS: BOOKING_SUCCESS_SUGGESTIONS,
  BOOKINGS: BOOKINGS_PAGE_SUGGESTIONS,
};