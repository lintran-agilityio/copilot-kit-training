import { AGENT_KEYS } from "@repo/constants";

import { AGENT_ID_HEADER } from "./constants";

const KNOWN_AGENT_IDS = new Set<string>(Object.values(AGENT_KEYS));

const isKnownAgentId = (value: string | null | undefined): value is string =>
  Boolean(value && KNOWN_AGENT_IDS.has(value));

const parseSingleRouteAgentId = async (
  request: Request,
): Promise<string | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json") || request.method !== "POST") {
    return null;
  }

  try {
    const envelope = (await request.clone().json()) as {
      params?: { agentId?: unknown };
    };

    const agentId = envelope.params?.agentId;
    return typeof agentId === "string" && agentId.trim()
      ? agentId.trim()
      : null;
  } catch {
    return null;
  }
};

export const resolveAgentId = async (
  request: Request,
): Promise<string> => {
  const headerAgentId = request.headers.get(AGENT_ID_HEADER)?.trim();
  if (isKnownAgentId(headerAgentId)) {
    return headerAgentId;
  }

  const bodyAgentId = await parseSingleRouteAgentId(request);
  if (isKnownAgentId(bodyAgentId)) {
    return bodyAgentId;
  }

  return AGENT_KEYS.MANAGE_ASSISTANT;
};
