export const REQUEST_CONTEXT_KEYS = {
  AUTH: "auth",
  REQUEST_ID: "requestId",
  AGENT_ID: "agentId",
  BLOCKED_MESSAGE_IDS: "blockedMessageIds",
} as const;

export const CLERK_TOKEN_HEADER = "x-clerk-token";
export const AGENT_ID_HEADER = "x-agent-id";
