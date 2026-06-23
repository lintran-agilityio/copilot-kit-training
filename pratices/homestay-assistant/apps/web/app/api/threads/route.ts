import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { listThreads, createThread } from "agent/threads";

export const dynamic = "force-dynamic";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const GET = async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId query param is required" },
      { status: 400 },
    );
  }

  try {
    const threads = await listThreads(userId, agentId);
    return NextResponse.json({ threads, nextCursor: null });
  } catch (error) {
    console.error("Failed to list Mastra threads", error);
    return NextResponse.json(
      { error: "Failed to list threads" },
      { status: 500 },
    );
  }
};

export const POST = async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  let body: { agentId?: string; title?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  try {
    const thread = await createThread(userId, body.agentId, body.title);
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error("Failed to create Mastra thread", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 },
    );
  }
};
