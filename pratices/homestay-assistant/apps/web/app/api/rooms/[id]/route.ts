import { auth } from "@clerk/nextjs/server";

import { getRoomById } from "@/features/room/services";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const checkInDate = searchParams.get("checkInDate") ?? undefined;
  const checkOutDate = searchParams.get("checkOutDate") ?? undefined;

  const room = await getRoomById({
    roomId: id,
    userId,
    checkInDate,
    checkOutDate,
  });

  return Response.json(room);
}
