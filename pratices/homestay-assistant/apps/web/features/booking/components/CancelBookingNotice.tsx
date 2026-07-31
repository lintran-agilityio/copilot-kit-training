"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ToolSuccessNotice } from "@/features/copilot/components/ToolSuccessNotice";
import type { CancelBookingToolProps } from "@/features/booking/types";
import { isCancelBookingSuccess } from "@/features/booking/utils";

export const CancelBookingNotice = (props: CancelBookingToolProps) => {
  const queryClient = useQueryClient();
  const onSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  }, [queryClient]);

  return (
    <ToolSuccessNotice
      {...props}
      title="Booking cancelled"
      description="Your booking has been cancelled successfully."
      isSuccess={isCancelBookingSuccess}
      onSuccess={onSuccess}
    />
  );
};
