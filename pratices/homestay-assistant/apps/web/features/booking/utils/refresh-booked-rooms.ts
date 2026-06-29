import { getRooms } from "@/features/room/services";
import { useRoomStore } from "@/features/room/stores/room-store";

import { getMyBookings } from "../services";
import { mappingBookedToRooms } from "./booking";

export const BOOKED_ROOMS_TITLE = "Room are booked";

export const refreshBookedRooms = async (configUrl = "/api") => {
  const [bookings, rooms] = await Promise.all([
    getMyBookings({ configUrl }),
    getRooms({ configUrl }),
  ]);

  const bookedRooms = mappingBookedToRooms(bookings, rooms);
  useRoomStore.getState().updateRoomList(bookedRooms, BOOKED_ROOMS_TITLE);

  return bookedRooms;
};
