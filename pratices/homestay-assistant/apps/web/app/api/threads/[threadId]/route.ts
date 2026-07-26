import { auth } from "@clerk/nextjs/server";
import { AGENT_KEYS } from "@repo/constants";

import {
  deleteMastraThread,
  renameMastraThread,
} from "@/features/chat/server/mastra-thread-store";

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
  const { userId } = await auth();

  if (!userId) {
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
      userId,
      agentId,
      threadId,
      name,
    });

    if (!thread) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    return Response.json({ thread });
  } catch (error) {
    console.error("Failed to rename Mastra thread", error);
    return Response.json(
      { error: "Failed to rename thread" },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request, { params }: ThreadRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { threadId } = await params;
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? AGENT_KEYS.MANAGE_ASSISTANT;

  try {
    const didDelete = await deleteMastraThread({
      userId,
      agentId,
      threadId,
    });

    if (!didDelete) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete Mastra thread", error);
    return Response.json(
      { error: "Failed to delete thread" },
      { status: 502 },
    );
  }
}
