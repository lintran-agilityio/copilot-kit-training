import { auth } from "@clerk/nextjs/server";

import { getMyBookings } from "@/features/booking/services";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await getMyBookings(userId);

  return bookings;
}
