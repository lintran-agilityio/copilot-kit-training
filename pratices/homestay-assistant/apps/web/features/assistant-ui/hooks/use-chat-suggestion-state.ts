import { usePathname } from "next/navigation";
import { useBooking } from "@/features/booking/hooks";
import { ChatSuggestionState } from "@/features/assistant-ui/types";

export const useChatSuggestionState = (): ChatSuggestionState => {
  const pathname = usePathname();

  const selectedRoom = useBooking((s) => s.selectedRoom);
  const booking = useBooking((s) => s.createdBooking);
  const isBookingDrawerOpen = useBooking((s) => s.isFormReady);

  if (booking) {
    return ChatSuggestionState.BOOKING_SUCCESS;
  }

  if (isBookingDrawerOpen) {
    return ChatSuggestionState.BOOKING_FORM;
  }

  if (selectedRoom) {
    return ChatSuggestionState.ROOM_DETAIL;
  }

  if (pathname === "/bookings") {
    return ChatSuggestionState.BOOKINGS;
  }

  return ChatSuggestionState.HOME;
};
