"use client";

import {
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks/use-booking";
import {
  confirmBookingSchema,
  selectRoomForBookingSchema,
} from "@/features/room/schemas/booking-schemas";
import {
  openRoomDetailDrawerSchema,
  updateRoomListSchema,
} from "@/features/room/schemas/room-schemas";
import { useRoomStore } from "@/features/room/stores/room-store";

import { ConfirmBookingPrompt } from "./ConfirmBookingPrompt";

export const RoomToolsProvider = () => {
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
  const setCheckInDate = useBooking((state) => state.setCheckInDate);
  const setCheckOutDate = useBooking((state) => state.setCheckOutDate);
  const setGuests = useBooking((state) => state.setGuests);
  const calculateTotalPrice = useBooking((state) => state.calculateTotalPrice);

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_ROOM_LIST,
      description:
        "Update the room grid on the page. Pass the rooms array returned from getRooms or getAvailableRooms.",
      parameters: updateRoomListSchema,
      handler: async ({ rooms, title }) => {
        useRoomStore.getState().updateRoomList(rooms, title);
        return `Updated room grid with ${rooms.length} room(s).`;
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_ROOM_DETAIL_DRAWER,
      description:
        "Open the room detail drawer. Pass the room object returned from getRoomById.",
      parameters: openRoomDetailDrawerSchema,
      handler: async ({ room }) => {
        useRoomStore.getState().openRoomDetailDrawer(room);
        return `Opened room detail drawer for ${room.name}.`;
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: "selectRoomForBooking",
      description:
        "Add a room to the user's booking draft. Use after the user picks a room.",
      parameters: selectRoomForBookingSchema,
      handler: async ({ id, name, pricePerNight, capacity }) => {
        setSelectedRoom({ id, name, pricePerNight, capacity });
        return `Selected ${name} for the booking draft.`;
      },
    },
    [setSelectedRoom],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: "confirmBooking",
      description:
        "Ask the user to confirm a room booking before finalizing the draft.",
      parameters: confirmBookingSchema,
      render: ({ status, args, respond }) => {
        if (status === "inProgress") {
          return (
            <p className="text-sm text-zinc-400">Preparing booking summary…</p>
          );
        }

        if (status === "complete") {
          return (
            <p className="text-sm text-zinc-300">
              Booking decision recorded for {args.roomName}.
            </p>
          );
        }

        if (status !== "executing" || !respond) {
          return (
            <p className="text-sm text-zinc-400">Awaiting booking confirmation…</p>
          );
        }

        return (
          <ConfirmBookingPrompt
            args={args}
            disabled={false}
            onApprove={() => {
              setCheckInDate(args.checkInDate);
              setCheckOutDate(args.checkOutDate);
              setGuests(args.guests);
              calculateTotalPrice();
              respond({ confirmed: true, totalPrice: args.totalPrice });
            }}
            onDeny={() => respond({ confirmed: false })}
          />
        );
      },
    },
    [calculateTotalPrice, setCheckInDate, setCheckOutDate, setGuests],
  );

  return null;
};
