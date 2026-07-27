import { auth } from "@clerk/nextjs/server";

import { cancelBookingById } from "@/features/booking/services/cancel-booking";
import { PREFIX_URL } from "@repo/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const booking = await cancelBookingById({
      bookingId: id,
      via: PREFIX_URL.BACKEND,
    });

    if (booking.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(booking);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel booking";

    return Response.json({ error: message }, { status: 400 });
  }
}
