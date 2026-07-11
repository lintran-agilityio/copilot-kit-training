import { getBookingStoreState } from "@/features/booking/stores/booking-provider";
import { useBookingsStore } from "@/features/booking/stores/booking-store";
import type { SyncBookingResultArgs } from "@/features/booking/schemas";
import type {
  BookingItem,
  BookingResponse,
} from "@/features/booking/types/booking";
import { stripRoomBookingOverlay } from "@/features/room/utils/strip-room-booking-overlay";
import { useRoomStore } from "@/features/room/stores/room-store";

export const clearBookingDraftAfterCancellation = () => {
  getBookingStoreState().resetBooking();
};

export const refreshRoomsAfterCancellation = () => {
  const {
    rooms,
    roomListTitle,
    selectedRoom,
    updateRoomList,
    openRoomDetailModal,
  } = useRoomStore.getState();

  const refreshedRooms = rooms.map(stripRoomBookingOverlay);
  updateRoomList(refreshedRooms, roomListTitle);

  if (selectedRoom) {
    openRoomDetailModal(stripRoomBookingOverlay(selectedRoom));
  }
};

export const syncBookingResultToStore = ({
  status,
  booking,
  errorMessage,
}: SyncBookingResultArgs) => {
  const bookingStore = getBookingStoreState();

  if (status === "success" && booking) {
    const created: BookingItem = {
      id: booking.id,
      userId: booking.userId ?? "",
      roomId: booking.roomId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      status: (booking.status ?? "confirmed") as BookingItem["status"],
    };

    bookingStore.setCreatedBooking(created);
    bookingStore.setSubmitStatus("success");
    useBookingsStore.getState().upsertBooking(created as BookingResponse);
    return `Booking ${created.id} synced to the UI.`;
  }

  bookingStore.setSubmitStatus(
    "error",
    errorMessage ?? "Failed to create booking"
  );
  return errorMessage ?? "Booking failed.";
};

export const syncBookingsListToStore = (bookings: BookingResponse[]) => {
  useBookingsStore.getState().setBookings(bookings);
  return `Updated bookings list with ${bookings.length} booking(s).`;
};

export const showCancellationSuccessUi = (roomName?: string) => {
  clearBookingDraftAfterCancellation();
  refreshRoomsAfterCancellation();
  useBookingsStore.getState().setCancellationNotice({
    roomName: roomName ?? "your room",
  });
  return "Showed cancellation success notice.";
};
