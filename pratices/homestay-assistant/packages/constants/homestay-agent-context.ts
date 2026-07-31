/** Canonical screen.name values — must match HomestayAgentContext JSON from the web app. */
export const HOMESTAY_AGENT_SCREEN_NAMES = [
  "home",
  "room-detail",
  "booking-form",
  "bookings",
] as const;

export type HomestayAgentScreenName =
  (typeof HOMESTAY_AGENT_SCREEN_NAMES)[number];

const SCREEN_NAMES_PROMPT = HOMESTAY_AGENT_SCREEN_NAMES.join(" | ");

export const HOMESTAY_AGENT_CONTEXT_READABLE_DESCRIPTION =
  `HomestayAgentContext: screen.name (${SCREEN_NAMES_PROMPT}), optional focus (room|booking + id), optional task (discover|book|cancel|manage + status). Match tools/replies to this context; never invent focus ids. Relative stay dates are resolved from the separate Current Date agent context (today/tomorrow), not from prior chat turns.`;

export const HOMESTAY_AGENT_CONTEXT_PROMPT_SECTION = `## HOMESTAY AGENT CONTEXT
The frontend injects HomestayAgentContext as JSON. Use \`screen.name\` only — do not infer location from legacy booleans (e.g. isBookingsPage).
- \`home\` — room grid / discover
- \`room-detail\` — viewing a specific room (\`focus.type\` room + id when set)
- \`booking-form\` — booking or modify draft UI open (\`task.type\` often book)
- \`bookings\` — reservations list (\`task.type\` often manage)
Optional \`focus\` and \`task\` refine intent. Align tool choice and chat handoffs with this context.`;
