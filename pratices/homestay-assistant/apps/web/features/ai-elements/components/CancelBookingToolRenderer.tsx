"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { isCancelBookingSuccess } from "@/features/ai-elements/utils";
import { CancelBookingResult, CancelBookingToolProps } from "../type";
import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";
import { ConfirmSuccess } from "@/components/common";

export const CancelBookingToolRenderer = ({
  status,
  result,
}: CancelBookingToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return <Loading />;
  }

  if (
    status === ToolCallStatus.Complete &&
    isCancelBookingSuccess(result)
  ) {
    const parsed = parseToolResult<CancelBookingResult>(result);
    const bookingId = parsed?.id;
    const roomName = parsed?.room?.name;

    return (
      <ConfirmSuccess
        title="Booking cancelled"
        description="Your booking has been cancelled successfully."
        id={bookingId}
        name={roomName}
      />
    );
  }

  return null;
};
