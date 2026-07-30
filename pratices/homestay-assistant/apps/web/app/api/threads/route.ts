import { AGENT_KEYS } from "@repo/constants";

import { listMastraThreads } from "@/features/chat/server/thread-service";
import { requireThreadAuth } from "@/features/chat/server/thread-auth";
import {
  MastraAgentError,
  MastraAgentUnavailableError,
} from "@/features/chat/server/mastra-agent-client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authContext = await requireThreadAuth(request);

  if (!authContext) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;

  try {
    const threads = await listMastraThreads({
      userId: authContext.userId,
      agentId,
      clerkToken: authContext.clerkToken,
    });

    return Response.json({ threads });
  } catch (error) {
    if (error instanceof MastraAgentUnavailableError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof MastraAgentError) {
      return Response.json(
        { error: "Failed to load threads" },
        { status: error.status >= 500 ? 502 : error.status },
      );
    }

    throw error;
  }
}
