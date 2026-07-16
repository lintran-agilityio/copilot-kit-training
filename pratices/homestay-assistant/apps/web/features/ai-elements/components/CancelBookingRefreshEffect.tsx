import { useQueryClient } from "@tanstack/react-query";
import { ToolCallStatus } from "@copilotkit/react-core/v2";
import { useRef, useEffect } from "react";

import { CancelBookingToolProps } from "../type";
import { isCancelBookingSuccess } from "../utils";

export function CancelBookingRefreshEffect({
  status,
  result,
}: CancelBookingToolProps) {
  const queryClient = useQueryClient();
  const refreshed = useRef(false);

  useEffect(() => {
    if (
      status === ToolCallStatus.Complete &&
      isCancelBookingSuccess(result) &&
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