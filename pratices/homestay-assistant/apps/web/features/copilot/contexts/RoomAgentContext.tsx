"use client";

import { ROOMS } from "@/data/rooms";
import { useAgentContext } from "@copilotkit/react-core/v2";

export const RoomAgentContext = () => {
  useAgentContext({
    description: "Available rooms in the homestay booking system",
    value: ROOMS.map(({ id, name, capacity, amenities, availableSlots, level }) => ({
      id,
      name,
      capacity,
      amenities,
      availableSlots,
      level,
    })),
  });

  return null;
};
