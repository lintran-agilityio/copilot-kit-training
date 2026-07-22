import { useQueryClient } from "@tanstack/react-query";
import { ToolCallStatus } from "@copilotkit/react-core/v2";
import { useRef, useEffect } from "react";

import type { UpdateBookingToolProps } from "@/features/booking/copilot/types";
import { isUpdateBookingSuccess } from "@/features/booking/copilot/utils/update-booking-success";

export function UpdateBookingRefreshEffect({
  status,
  result,
}: UpdateBookingToolProps) {
  const queryClient = useQueryClient();
  const refreshed = useRef(false);

  useEffect(() => {
    if (
      status === ToolCallStatus.Complete &&
      isUpdateBookingSuccess(result) &&
      !refreshed.current
    ) {
      refreshed.current = true;

      queryClient.invalidateQueries({
        queryKey: ["bookings"],
      });
    }
  }, [status, result, queryClient]);

  return null;
}
