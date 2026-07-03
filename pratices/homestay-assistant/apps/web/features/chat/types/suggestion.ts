export type ChatSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

export enum ChatSuggestionState {
  HOME = "HOME",
  ROOM_DETAIL = "ROOM_DETAIL",
  BOOKING_FORM = "BOOKING_FORM",
  BOOKING_SUCCESS = "BOOKING_SUCCESS",
  BOOKINGS = "BOOKINGS",
}
