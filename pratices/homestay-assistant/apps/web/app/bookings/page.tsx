import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getMyBookings } from "@/features/booking/services";

import { BookingsPageClient } from "./bookings-page-client";
import { mappingBookedToRooms } from "@/features/booking/utils";

const BookingsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect(ROUTES.LOGIN);
  }

  const bookings = await getMyBookings(userId);
  const bookedRooms = mappingBookedToRooms(bookings);

  return <BookingsPageClient bookedRooms={bookedRooms} />;
};

export default BookingsPage;
