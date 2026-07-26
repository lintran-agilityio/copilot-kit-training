import { auth } from "@clerk/nextjs/server";
import { AGENT_KEYS } from "@repo/constants";

import { listMastraThreadMessages } from "@/features/chat/server/mastra-thread-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { threadId } = await params;
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;

  try {
    const messages = await listMastraThreadMessages({
      userId,
      agentId,
      threadId,
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("Failed to list Mastra thread messages", error);
    return Response.json(
      { error: "Failed to list thread messages" },
      { status: 502 },
    );
  }
}
