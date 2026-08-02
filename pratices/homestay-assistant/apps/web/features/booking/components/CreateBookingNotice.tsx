"use client";

import { ToolSuccessNotice } from "@/features/copilot/components/ToolSuccessNotice";
import { useBooking } from "@/features/booking/hooks";
import { CreateBookingToolProps } from "@/features/booking/types";
import { isCreateBookingSuccess } from "@/features/booking/utils";

export const CreateBookingNotice = (props: CreateBookingToolProps) => {
  const resetBooking = useBooking((state) => state.resetBooking);

  return (
    <ToolSuccessNotice
      {...props}
      title="Booking success"
      description="Your stay has been booked successfully."
      isSuccess={isCreateBookingSuccess}
      onSuccess={resetBooking}
    />
  );
};
