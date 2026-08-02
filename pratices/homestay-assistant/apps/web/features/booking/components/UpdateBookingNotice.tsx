"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ToolSuccessNotice } from "@/features/copilot/components/ToolSuccessNotice";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { UpdateBookingToolProps } from "@/features/booking/types";
import { isUpdateBookingSuccess } from "@/features/booking/utils";

export const UpdateBookingNotice = (props: UpdateBookingToolProps) => {
  const queryClient = useQueryClient();
  const setPendingModifyStay = useBookingStore(
    (state) => state.setPendingModifyStay,
  );
  const onSuccess = useCallback(() => {
    setPendingModifyStay(null);
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  }, [queryClient, setPendingModifyStay]);

  return (
    <ToolSuccessNotice
      {...props}
      title="Booking updated"
      description="Your booking has been updated successfully."
      isSuccess={isUpdateBookingSuccess}
      onSuccess={onSuccess}
    />
  );
};
