import type { HomestayAgentContext } from "@/features/chat/types";

const BASE_SUGGESTION_RULES = `Based on HomestayAgentContext (screen, focus, task) and the conversation,
suggest the most useful next actions for the guest.

Suggestions must be:
- contextual to screen/focus/task
- actionable
- concise
- based on available data
- consistent with the current agent workflow

Never invent data.
Never suggest completed actions.
Never suggest actions that contradict the current booking state.
Each suggestion title should be a short pill label; the message should be a clear user request the assistant can act on.`;

const INSTRUCTIONS_BY_SCREEN: Record<
  HomestayAgentContext["screen"]["name"],
  string
> = {
  home: `HomestayAgentContext screen.name is "home" (task.type usually "discover").
Prefer showing available rooms, luxury rooms, checking availability for dates, or viewing their bookings.`,

  "room-detail": `HomestayAgentContext screen.name is "room-detail" (focus.type usually "room").
Prefer booking this room, checking availability for dates, or asking about amenities.
If focus.id is set and suggesting a booking, the message MUST include that roomId and the room name when known.`,

  "booking-form": `HomestayAgentContext screen.name is "booking-form" (task.type usually "book").
If task.status is "awaiting-confirmation" or "in-progress", prefer adjusting dates/guests, canceling the draft, or browsing other rooms.
If task.status is "completed", prefer viewing their bookings or browsing more rooms.`,

  bookings: `HomestayAgentContext screen.name is "bookings" (task.type usually "manage").
Prefer canceling a booking or browsing rooms for a new stay.`,
};

export const getSuggestionInstructions = (
  context: HomestayAgentContext,
  roomName?: string | null,
): string => {
  const screenInstructions = INSTRUCTIONS_BY_SCREEN[context.screen.name];
  const focusLine = context.focus
    ? `focus: ${context.focus.type} id=${context.focus.id}`
    : "focus: none";
  const taskLine = context.task
    ? `task: ${context.task.type} / ${context.task.status}`
    : "task: none";

  const roomLine =
    (context.screen.name === "room-detail" ||
      context.screen.name === "booking-form") &&
    context.focus?.type === "room" &&
    roomName
      ? `The guest is viewing "${roomName}" (roomId: ${context.focus.id}).
If suggesting a booking, the message MUST include roomId: ${context.focus.id} and the room name.`
      : null;

  return [
    BASE_SUGGESTION_RULES,
    "",
    `Current HomestayAgentContext: screen=${context.screen.name}; ${focusLine}; ${taskLine}.`,
    screenInstructions,
    roomLine,
  ]
    .filter(Boolean)
    .join("\n");
};
