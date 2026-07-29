import { auth } from "@clerk/nextjs/server";
import { AGENT_KEYS } from "@repo/constants";

import { listMastraThreads } from "@/features/chat/server/mastra-thread-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;

  try {
    const threads = await listMastraThreads({ userId, agentId });
    return Response.json({ threads });
  } catch (error) {
    console.error("Failed to list Mastra threads", error);
    return Response.json(
      { error: "Failed to list threads" },
      { status: 502 },
    );
  }
}
