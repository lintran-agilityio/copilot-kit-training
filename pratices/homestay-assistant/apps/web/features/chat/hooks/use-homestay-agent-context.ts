import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { useBooking } from "@/features/booking/hooks";
import {
  selectActiveHomestayWorkflow,
  selectFocusedRoomId,
  useHomestayAgentUiStore,
} from "@/features/chat/stores/homestay-agent-ui-store";
import type { HomestayAgentContext } from "@/features/chat/types";
import { buildHomestayAgentContext } from "@/features/chat/utils/build-homestay-agent-context";

export const useHomestayAgentContext = (): HomestayAgentContext => {
  const pathname = usePathname();
  const roomId = useBooking((s) => s.roomId);
  const checkInDate = useBooking((s) => s.checkInDate);
  const checkOutDate = useBooking((s) => s.checkOutDate);
  const focusedRoomId = useHomestayAgentUiStore((s) =>
    selectFocusedRoomId(s.focusedRoomStack),
  );
  const workflowEntries = useHomestayAgentUiStore((s) => s.workflowEntries);

  return useMemo(() => {
    const activeWorkflow = selectActiveHomestayWorkflow(workflowEntries);

    return buildHomestayAgentContext(
      pathname,
      { roomId, checkInDate, checkOutDate },
      { focusedRoomId, activeWorkflow },
    );
  }, [
    checkInDate,
    checkOutDate,
    focusedRoomId,
    pathname,
    roomId,
    workflowEntries,
  ]);
};
