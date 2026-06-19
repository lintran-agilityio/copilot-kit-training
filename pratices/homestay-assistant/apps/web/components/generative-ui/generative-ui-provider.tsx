"use client";

import { useComponent, useAgentContext } from "@copilotkit/react-core/v2";

import { ListRoom, Room } from "@/components/rooms";
import {
  roomCardSchema,
  roomGridSchema,
} from "@/components/generative-ui/schemas";
import { getRoomsByIds, ROOMS } from "@/data/rooms";
import { AGENT_KEYS } from "@repo/constants";

function GenerativeRoomCard(props: React.ComponentProps<typeof Room>) {
  return <Room {...props} compact />;
}

function GenerativeRoomGrid({
  roomIds,
  title,
}: {
  roomIds: string[];
  title?: string;
}) {
  const rooms = getRoomsByIds(roomIds);

  return <ListRoom rooms={rooms} title={title} compact />;
}

export function GenerativeUIProvider() {
  useAgentContext({
    description: "Available rooms in the SPACES booking system",
    value: ROOMS.map(({ id, name, capacity, amenities, availableSlots, level }) => ({
      id,
      name,
      capacity,
      amenities,
      availableSlots,
      level,
    })),
  });

  useComponent(
    {
      name: "render_room_card",
      description:
        "Display a single room recommendation card in chat when suggesting a specific room to the user.",
      parameters: roomCardSchema,
      render: GenerativeRoomCard,
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
    },
    [],
  );

  useComponent(
    {
      name: "render_room_grid",
      description:
        "Display a list of room cards in chat when showing multiple matching rooms or search results.",
      parameters: roomGridSchema,
      render: GenerativeRoomGrid,
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
    },
    [],
  );

  return null;
}
