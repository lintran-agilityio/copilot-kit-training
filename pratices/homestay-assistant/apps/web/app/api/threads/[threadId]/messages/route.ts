import { AGENT_KEYS } from "@repo/constants";

import { listMastraThreadMessages } from "@/features/chat/server/thread-service";
import { requireThreadAuth } from "@/features/chat/server/thread-auth";
import { MastraAgentError } from "@/features/chat/server/mastra-agent-client";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const authContext = await requireThreadAuth(request);

  if (!authContext) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { threadId } = await params;
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;

  try {
    const messages = await listMastraThreadMessages({
      userId: authContext.userId,
      agentId,
      threadId,
      clerkToken: authContext.clerkToken,
    });

    return Response.json({ messages });
  } catch (error) {
    if (error instanceof MastraAgentError) {
      return Response.json(
        { error: "Failed to load thread messages" },
        { status: error.status >= 500 ? 502 : error.status },
      );
    }

    throw error;
  }
}
