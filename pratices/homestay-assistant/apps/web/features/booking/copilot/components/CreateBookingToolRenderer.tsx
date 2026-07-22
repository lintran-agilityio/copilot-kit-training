"use client";

import { useEffect, useRef } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmSuccess } from "@/components/confirm-modal";
import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";
import { useBooking } from "@/features/booking/hooks";
import type {
  CreateBookingResult,
  CreateBookingToolProps,
} from "@/features/booking/copilot/types";
import { isCreateBookingSuccess } from "@/features/booking/copilot/utils/create-booking-success";

export const CreateBookingToolRenderer = ({
  status,
  result,
}: CreateBookingToolProps) => {
  const resetBooking = useBooking((state) => state.resetBooking);
  const reset = useRef(false);

  useEffect(() => {
    if (
      status === ToolCallStatus.Complete &&
      isCreateBookingSuccess(result) &&
      !reset.current
    ) {
      reset.current = true;
      resetBooking();
    }
  }, [status, result, resetBooking]);

  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return <Loading />;
  }

  if (
    status === ToolCallStatus.Complete &&
    isCreateBookingSuccess(result)
  ) {
    const parsed = parseToolResult<CreateBookingResult>(result);

    return (
      <ConfirmSuccess
        title="Booking confirmed"
        description="Your stay has been booked successfully."
        id={parsed?.id}
        name={parsed?.room?.name}
      />
    );
  }

  return null;
};
