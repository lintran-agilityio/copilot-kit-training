import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getThreadMessages } from "agent/threads";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const GET = async (request: Request, context: RouteContext) => {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { threadId } = await context.params;
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId query param is required" },
      { status: 400 },
    );
  }

  try {
    const messages = await getThreadMessages(threadId, userId, agentId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to load Mastra thread messages", error);
    return NextResponse.json(
      { error: "Failed to load thread messages" },
      { status: 500 },
    );
  }
};
