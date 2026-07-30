import { auth } from "@clerk/nextjs/server";
import { CLERK_TOKEN_HEADER } from "agent/middleware";

import {
  agentUnavailableMessage,
  fetchAgent,
  getAgentBaseUrl,
  isAgentConnectionError,
} from "@/features/chat/server/mastra-agent-client";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const resolveClerkToken = async (request: Request) => {
  const headerToken = request.headers.get(CLERK_TOKEN_HEADER)?.trim();
  if (headerToken) {
    return headerToken;
  }

  const { getToken } = await auth();
  return (await getToken()) ?? null;
};

const buildForwardHeaders = (request: Request, clerkToken: string) => {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    const normalizedKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(normalizedKey) || normalizedKey === "host") {
      continue;
    }

    headers.set(key, value);
  }

  headers.set(CLERK_TOKEN_HEADER, clerkToken);
  headers.set("authorization", `Bearer ${clerkToken}`);

  return headers;
};

const COPILOTKIT_WEB_PREFIX = "/api/copilotkit";
const COPILOTKIT_AGENT_PREFIX = "/copilotkit";

const mapCopilotKitPath = (pathname: string) => {
  if (
    pathname === COPILOTKIT_WEB_PREFIX ||
    pathname.startsWith(`${COPILOTKIT_WEB_PREFIX}/`)
  ) {
    return pathname.replace(COPILOTKIT_WEB_PREFIX, COPILOTKIT_AGENT_PREFIX);
  }

  return pathname;
};

const buildProxyResponseHeaders = (response: Response) => {
  const headers = new Headers();

  for (const [key, value] of response.headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      continue;
    }

    headers.set(key, value);
  }

  return headers;
};

export const proxyCopilotKitRequest = async (request: Request): Promise<Response> => {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const clerkToken = await resolveClerkToken(request);

  if (!clerkToken) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const agentPath = mapCopilotKitPath(requestUrl.pathname);
  const targetUrl = `${getAgentBaseUrl()}${agentPath}${requestUrl.search}`;
  const headers = buildForwardHeaders(request, clerkToken);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;

  try {
    upstream = await fetchAgent(targetUrl, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
    });
  } catch (error) {
    if (isAgentConnectionError(error)) {
      return Response.json({ error: agentUnavailableMessage() }, { status: 503 });
    }

    throw error;
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildProxyResponseHeaders(upstream),
  });
};
