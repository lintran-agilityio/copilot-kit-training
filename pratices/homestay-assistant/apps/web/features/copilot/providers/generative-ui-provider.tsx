"use client";

import { Room } from "@/features/room/components";
import { RenderRooms } from "@/features/room/generative";
import { roomCardSchema, roomGridSchema } from "@/features/room/schemas/room-schemas";
import { useComponent } from "@copilotkit/react-core/v2";
import { AGENT_KEYS } from "@repo/constants";

export const GenerativeUIProvider = () => {
  useComponent({
    agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
    name: "showRoomCard",
    description: "Display a single room recommendation card.",
    parameters: roomCardSchema,
    render: Room,
  }, []);

  useComponent({
    agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
    name: "showRoomGrid",
    description: "Display a list of matching rooms",
    parameters: roomGridSchema,
    render: RenderRooms,
  }, []);

  return null;
};
