/**
 * Total input token budget (system + conversation) before each LLM call.
 * Must stay above manage-agent system prompt + working-memory instructions
 * (~15–16k tokens). 16_384 left almost no room for the user turn and made
 * TokenLimiterProcessor tripwire on normal requests like "show my booking".
 */
export const AGENT_INPUT_TOKEN_LIMIT = 32_768;

/** Maximum tokens allowed in a single user message. */
export const AGENT_MAX_USER_MESSAGE_TOKEN_LIMIT = 4_096;

/** Maximum tokens the model may generate for one agent step. */
export const AGENT_MAX_OUTPUT_TOKEN_LIMIT = 1_024;

/** Mastra thread recall cap for manage-assistant conversation history. */
export const AGENT_MEMORY_LAST_MESSAGES = 10;
