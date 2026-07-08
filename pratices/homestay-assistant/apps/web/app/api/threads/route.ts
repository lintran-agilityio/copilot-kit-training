import { auth } from "@clerk/nextjs/server";
import { AGENT_KEYS } from "@repo/constants";

import { listMastraThreads } from "@/features/assistant-ui/server/mastra-thread-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;
  const threads = listMastraThreads({ userId, agentId });

  return Response.json({ threads });
}
