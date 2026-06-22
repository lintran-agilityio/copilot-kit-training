// Libs
import { useCopilotReadable } from "@copilotkit/react-core/v2";

import { useBooking } from "../../booking/hooks/use-booking";

export const BookingReadable = () => {
  const booking = useBooking((state) => ({
    selectedRoom: state.selectedRoom,
    checkInDate: state.checkInDate,
    checkOutDate: state.checkOutDate,
    guests: state.guests,
    totalPrice: state.totalPrice,
  }));

  useCopilotReadable({
    description: "Current draft booking",
    value: booking,
  });

  return null;
};
