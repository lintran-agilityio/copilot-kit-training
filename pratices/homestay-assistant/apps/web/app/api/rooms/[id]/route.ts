import { getRoomById } from "@/features/room/services";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const response = await getRoomById(id);

  return response;
}
