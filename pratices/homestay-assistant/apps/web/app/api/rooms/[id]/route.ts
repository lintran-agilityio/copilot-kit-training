import { getRoomById } from "@/features/room/services";
import { getApiUrl } from "@/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const room = await getRoomById({
    configUrl: getApiUrl(),
    roomId: id,
  });

  return Response.json(room);
}
