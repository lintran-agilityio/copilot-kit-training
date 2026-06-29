import { getRooms } from "@/features/room/services";
import { getApiUrl } from "@/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const rooms = await getRooms({
    configUrl: getApiUrl(),
    date: date ?? undefined
  });

  return Response.json(rooms);
}
