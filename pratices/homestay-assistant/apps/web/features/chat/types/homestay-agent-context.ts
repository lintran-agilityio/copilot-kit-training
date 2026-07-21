export type HomestayAgentScreenName =
  | "home"
  | "room-detail"
  | "booking-form"
  | "bookings";

export type HomestayAgentFocusType = "room" | "booking";

export type HomestayAgentTaskType =
  | "discover"
  | "book"
  | "cancel"
  | "manage";

export type HomestayAgentTaskStatus =
  | "idle"
  | "in-progress"
  | "awaiting-confirmation"
  | "completed";

export type HomestayAgentContext = {
  screen: {
    name: HomestayAgentScreenName;
  };
  focus?: {
    type: HomestayAgentFocusType;
    id: string;
    // name: string;
  };
  task?: {
    type: HomestayAgentTaskType;
    status: HomestayAgentTaskStatus;
  };
};
