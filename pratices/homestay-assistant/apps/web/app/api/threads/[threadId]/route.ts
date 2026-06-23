import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { renameThread } from "agent/threads";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const PATCH = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { threadId } = await context.params;

  let body: { name?: string; agentId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (!body.agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  try {
    const thread = await renameThread(
      threadId,
      userId,
      body.agentId,
      body.name.trim(),
    );
    return NextResponse.json(thread);
  } catch (error) {
    console.error("Failed to rename Mastra thread", error);
    return NextResponse.json(
      { error: "Failed to rename thread" },
      { status: 500 },
    );
  }
};
