"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmSuccess } from "@/components/confirm-modal";
import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";
import type {
  UpdateBookingResult,
  UpdateBookingToolProps,
} from "@/features/booking/copilot/types";
import { isUpdateBookingSuccess } from "@/features/booking/copilot/utils/update-booking-success";

export const UpdateBookingToolRenderer = ({
  status,
  result,
}: UpdateBookingToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return <Loading />;
  }

  if (status === ToolCallStatus.Complete && isUpdateBookingSuccess(result)) {
    const parsed = parseToolResult<UpdateBookingResult>(result);

    return (
      <ConfirmSuccess
        title="Booking updated"
        description="Your booking has been updated successfully."
        id={parsed?.id}
        name={parsed?.room?.name}
      />
    );
  }

  return null;
};
