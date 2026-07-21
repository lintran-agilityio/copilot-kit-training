import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants";
import { useBooking } from "@/features/booking/hooks";
import type { HomestayAgentContext } from "@/features/chat/types";

export const useHomestayAgentContext = (): HomestayAgentContext => {
  const pathname = usePathname();
  const roomId = useBooking((s) => s.roomId);

  return useMemo(() => {
    if (roomId) {
      return {
        screen: { name: "room-detail" },
        focus: { type: "room", id: roomId },
        task: { type: "discover", status: "idle" },
      } satisfies HomestayAgentContext;
    }

    if (pathname === ROUTES.BOOKINGS) {
      return {
        screen: { name: "bookings" },
        task: { type: "manage", status: "idle" },
      } satisfies HomestayAgentContext;
    }

    return {
      screen: { name: "home" },
      task: { type: "discover", status: "idle" },
    } satisfies HomestayAgentContext;
  }, [pathname, roomId]);
};
