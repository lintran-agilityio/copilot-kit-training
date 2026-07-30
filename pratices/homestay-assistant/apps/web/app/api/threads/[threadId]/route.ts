import { AGENT_KEYS } from "@repo/constants";

import {
  deleteMastraThread,
  renameMastraThread,
} from "@/features/chat/server/thread-service";
import { requireThreadAuth } from "@/features/chat/server/thread-auth";
import { MastraAgentError } from "@/features/chat/server/mastra-agent-client";

export const runtime = "nodejs";

type ThreadRouteContext = {
  params: Promise<{
    threadId: string;
  }>;
};

type RenameThreadRequest = {
  agentId?: string;
  name?: string;
};

export async function PATCH(request: Request, { params }: ThreadRouteContext) {
  const authContext = await requireThreadAuth(request);

  if (!authContext) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { threadId } = await params;
  const body = (await request.json()) as RenameThreadRequest;
  const agentId = body.agentId ?? AGENT_KEYS.MANAGE_ASSISTANT;
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ error: "Thread name is required" }, { status: 400 });
  }

  try {
    const thread = await renameMastraThread({
      userId: authContext.userId,
      agentId,
      threadId,
      name,
      clerkToken: authContext.clerkToken,
    });

    if (!thread) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    return Response.json({ thread });
  } catch (error) {
    if (error instanceof MastraAgentError) {
      return Response.json(
        { error: "Failed to rename thread" },
        { status: error.status >= 500 ? 502 : error.status },
      );
    }

    throw error;
  }
}

export async function DELETE(request: Request, { params }: ThreadRouteContext) {
  const authContext = await requireThreadAuth(request);

  if (!authContext) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { threadId } = await params;
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;

  try {
    const didDelete = await deleteMastraThread({
      userId: authContext.userId,
      agentId,
      threadId,
      clerkToken: authContext.clerkToken,
    });

    if (!didDelete) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof MastraAgentError) {
      return Response.json(
        { error: "Failed to delete thread" },
        { status: error.status >= 500 ? 502 : error.status },
      );
    }

    throw error;
  }
}
