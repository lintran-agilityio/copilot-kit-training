export type ThreadStatus = "active" | "archived";

export type ThreadPrimaryIntent =
  | "room_discovery"
  | "booking"
  | "cancellation"
  | "view_bookings";

export type ThreadMetadata = {
  primaryIntent?: ThreadPrimaryIntent;
  relatedBookingId?: string;
  relatedRoomId?: string;
};

export type Thread = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
  status?: ThreadStatus;
  messageCount: number;
  agentId: string;
  lastRunAt?: Date;
  metadata?: ThreadMetadata;
};

export type ThreadLoadingState = "idle" | "loading" | "loaded" | "error";

export type ThreadDateGroupKey = "today" | "yesterday" | "older";

export type ThreadDateGroup = {
  key: ThreadDateGroupKey;
  label: string;
  threads: Thread[];
};
