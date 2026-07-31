"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ToolSuccessNotice } from "@/features/copilot/components/ToolSuccessNotice";
import { useBooking } from "@/features/booking/hooks";
import { CreateBookingToolProps } from "@/features/booking/types";
import { isCreateBookingSuccess } from "@/features/booking/utils";
import { useReportHomestayAgentWorkflow } from "@/features/chat/hooks/use-report-homestay-agent-workflow";

export const CreateBookingNotice = (props: CreateBookingToolProps) => {
  const resetBooking = useBooking((state) => state.resetBooking);
  const roomId = useBooking((state) => state.roomId);
  const isComplete =
    props.status === ToolCallStatus.Complete &&
    isCreateBookingSuccess(props.result);

  useReportHomestayAgentWorkflow(
    isComplete,
    "book-flow",
    { type: "book", status: "completed" },
    roomId ? { type: "room", id: roomId } : undefined,
  );

  return (
    <ToolSuccessNotice
      {...props}
      title="Booking confirmed"
      description="Your stay has been booked successfully."
      isSuccess={isCreateBookingSuccess}
      onSuccess={resetBooking}
    />
  );
};
