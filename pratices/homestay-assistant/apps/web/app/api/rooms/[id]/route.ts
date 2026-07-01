import { auth } from "@clerk/nextjs/server";

import { getRoomById } from "@/features/room/services";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const room = await getRoomById({
    roomId: id,
    userId,
  });

  return Response.json(room);
}
