import { proxyCopilotKitRequest } from "@/features/chat/server/copilot-agent-proxy";

export const runtime = "nodejs";

const handler = (request: Request) => proxyCopilotKitRequest(request);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
