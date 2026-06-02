import { NextResponse } from "next/server";
import { TODO_AGENT_NAME } from "@/ai/agents/todo-agent";

export async function GET() {
  return NextResponse.json({
    agents: {
      default: {},
      [TODO_AGENT_NAME]: {},
    },
    properties: {},
  });
}
