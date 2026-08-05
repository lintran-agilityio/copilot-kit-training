/**
 * Canonical agent id registry for CopilotKit + Mastra.
 * Prefer importing from here; `agent-keys` remains a shim.
 */
export const AGENT_NAMES = {
  MANAGE_ASSISTANT: "manage-assistant",
} as const;

export const AGENT_URLS = {
  MANAGE_ASSISTANT: "/api/copilotkit",
} as const;

/** @deprecated Prefer `AGENT_NAMES` — identical values. */
export const AGENT_KEYS = AGENT_NAMES;
