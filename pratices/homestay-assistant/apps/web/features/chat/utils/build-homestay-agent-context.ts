import { ROUTES } from "@/constants";
import type { HomestayAgentContext } from "@/features/chat/types";
import type { HomestayAgentWorkflowEntry } from "@/features/chat/stores/homestay-agent-ui-store";

export type HomestayAgentDraftSnapshot = {
  roomId: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
};

export type HomestayAgentUiSnapshot = {
  focusedRoomId: string | null;
  activeWorkflow: HomestayAgentWorkflowEntry | null;
};

export const buildHomestayAgentContext = (
  pathname: string,
  draft: HomestayAgentDraftSnapshot,
  ui: HomestayAgentUiSnapshot,
): HomestayAgentContext => {
  const active = ui.activeWorkflow;

  if (pathname === ROUTES.BOOKINGS) {
    return {
      screen: { name: "bookings" },
      ...(active?.focus ? { focus: active.focus } : {}),
      task: active?.task ?? { type: "manage", status: "idle" },
    };
  }

  const roomId =
    active?.focus?.type === "room"
      ? active.focus.id
      : (ui.focusedRoomId ?? draft.roomId);

  if (!roomId && !active) {
    return {
      screen: { name: "home" },
      task: { type: "discover", status: "idle" },
    };
  }

  const hasDraftForRoom =
    Boolean(roomId) &&
    draft.roomId === roomId &&
    Boolean(draft.checkInDate && draft.checkOutDate);

  const isBookingForm =
    active?.focus?.type === "booking" ||
    active?.task.type === "book" ||
    (active?.task.type === "manage" && active.task.status !== "idle") ||
    hasDraftForRoom;

  const screen = isBookingForm
    ? { name: "booking-form" as const }
    : { name: "room-detail" as const };

  const focus =
    active?.focus ??
    (roomId ? { type: "room" as const, id: roomId } : undefined);

  const defaultTask = hasDraftForRoom
    ? ({ type: "book" as const, status: "idle" as const })
    : ({ type: "discover" as const, status: "idle" as const });

  return {
    screen,
    ...(focus ? { focus } : {}),
    task: active?.task ?? defaultTask,
  };
};
