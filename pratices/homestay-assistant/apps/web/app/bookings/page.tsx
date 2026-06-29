import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getMyBookings } from "@/features/booking/services";
import { getRooms } from "@/features/room/services";

import { BookingsPageClient } from "./bookings-page-client";
import { mappingBookedToRooms } from "@/features/booking/utils";

const BookingsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect(ROUTES.LOGIN);
  }

  const [bookings, rooms] = await Promise.all([
    getMyBookings({ userId }),
    getRooms(),
  ]);
  const bookedRooms = mappingBookedToRooms(bookings, rooms);

  return <BookingsPageClient bookedRooms={bookedRooms} />;
};

export default BookingsPage;
