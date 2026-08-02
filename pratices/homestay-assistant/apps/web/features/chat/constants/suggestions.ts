import type { HomestayAgentContext } from "@/features/chat/types";
import { buildBookingFormMessage } from "@/features/booking/utils/build-messages";
import { PAGE_ROOMS_PROMPT_PREFIX } from "@/features/copilot/config/page-generative-ui";

export type StaticSuggestion = {
  title: string;
  message: string;
};

export const MAX_SUGGESTION_PILLS = 3;

const isActiveWorkflowTask = (context: HomestayAgentContext): boolean => {
  const task = context.task;
  if (!task) {
    return false;
  }

  if (task.type === "book" || task.type === "cancel") {
    return task.status !== "idle";
  }

  return task.type === "manage" && task.status !== "idle";
};

export const getWorkflowStaticSuggestions = (
  context: HomestayAgentContext,
  roomName?: string | null,
): StaticSuggestion[] => {
  const task = context.task;
  if (!task || !isActiveWorkflowTask(context)) {
    return [];
  }

  const roomId = context.focus?.type === "room" ? context.focus.id : undefined;
  const name = roomName?.trim() || "this room";

  if (task.type === "book") {
    if (task.status === "awaiting-confirmation") {
      return [
        {
          title: "Change dates",
          message: "I want to change my booking dates.",
        },
        {
          title: "Change guests",
          message: "I want to change the number of guests.",
        },
        {
          title: "Browse rooms",
          message: "Show me other available rooms.",
        },
      ];
    }

    if (task.status === "in-progress") {
      const suggestions: StaticSuggestion[] = [];

      if (roomId) {
        suggestions.push({
          title: "Open booking form",
          message: buildBookingFormMessage(roomId, name),
        });
      }

      suggestions.push({
        title: "Browse rooms",
        message: "Show me other available rooms.",
      });

      return suggestions;
    }

    if (task.status === "completed") {
      return [
        { title: "My bookings", message: "Show my bookings." },
        {
          title: "Book another",
          message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
        },
      ];
    }
  }

  if (task.type === "cancel") {
    return [
      {
        title: "Keep booking",
        message: "Never mind, keep my booking.",
      },
      {
        title: "Browse rooms",
        message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
      },
    ];
  }

  if (task.type === "manage" && task.status === "in-progress") {
    return [
      {
        title: "My bookings",
        message: "Show my bookings.",
      },
      {
        title: "Book a room",
        message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
      },
    ];
  }

  return [];
};

export const getPageStaticSuggestions = (
  context: HomestayAgentContext,
  roomName?: string | null,
): StaticSuggestion[] => {
  const roomId = context.focus?.type === "room" ? context.focus.id : undefined;
  const name = roomName?.trim() || "this room";

  switch (context.screen.name) {
    case "home":
      return [
        {
          title: "Browse rooms",
          message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
        },
        { title: "My bookings", message: "Show my bookings." },
        {
          title: "Find rooms",
          message: "Find available rooms for this weekend.",
        },
      ];

    case "room-detail":
      if (!roomId) {
        return [
          {
            title: "Browse rooms",
            message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
          },
        ];
      }

      return [
        {
          title: "Book this room",
          message: buildBookingFormMessage(roomId, name),
        },
        {
          title: "Amenities",
          message: `Tell me about ${name} amenities and details (roomId: ${roomId}).`,
        },
      ];

    case "booking-form":
      return [
        {
          title: "Browse rooms",
          message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
        },
        { title: "My bookings", message: "Show my bookings." },
      ];

    case "bookings":
      return [
        {
          title: "Book a room",
          message: `${PAGE_ROOMS_PROMPT_PREFIX} Load all rooms.`,
        },
        {
          title: "Find rooms",
          message: "Find available rooms for this weekend.",
        },
      ];
  }
};

/** Workflow static suggestions take precedence over page-level pills. */
export const getPriorityStaticSuggestions = (
  context: HomestayAgentContext,
  roomName?: string | null,
): StaticSuggestion[] => {
  const workflow = getWorkflowStaticSuggestions(context, roomName);
  const source = workflow.length
    ? workflow
    : getPageStaticSuggestions(context, roomName);

  return source.slice(0, MAX_SUGGESTION_PILLS);
};
