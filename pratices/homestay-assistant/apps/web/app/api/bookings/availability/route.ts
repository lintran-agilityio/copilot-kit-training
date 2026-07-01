import { auth } from "@clerk/nextjs/server";

import { checkRoomAvailability } from "@/features/booking/services";
import { PREFIX_URL } from "@/types";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const checkInDate = searchParams.get("checkInDate");
  const checkOutDate = searchParams.get("checkOutDate");

  if (!roomId || !checkInDate || !checkOutDate) {
    return Response.json(
      { error: "roomId, checkInDate, and checkOutDate are required" },
      { status: 400 },
    );
  }

  const result = await checkRoomAvailability({
    via: PREFIX_URL.BACKEND,
    roomId,
    checkInDate,
    checkOutDate,
  });

  return Response.json(result);
}
