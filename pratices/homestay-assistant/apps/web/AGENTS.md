# AGENTS.md (web)

## Stack ownership (CopilotKit v2 UI)

This app owns chat UI, HITL / generative tools, Stop click / idle, and **presentation state**.

Transcript and memory correctness belong upstream:

| Layer | Path | Owns |
| --- | --- | --- |
| CopilotKit v2 UI | `apps/web` | Presentation, Stop UX, HITL render |
| AG-UI bridge | `apps/agent/src/ag-ui` | Stream adapt, abort inject, transcript filters (`abort-controllers`, `transcript-filters`, `tripwire`, `stream-patch`) |
| Mastra | `apps/agent/src/mastra` | Agent, tools, processors, memory |

### Presentation vs temporary data workarounds

**Keep in the UI (presentation):**

- Animations, optimistic rendering, streaming bubbles
- Dismissing / dimming an incomplete assistant message when the user clicks Stop
- Deriving blocked styling from transcript shape / metadata at render (`isUserMessageBlockedInTranscript`)
- Choosing which generative cards to show in a turn (e.g. latest `find_room`)

**Treat as temporary compatibility (phase out when source is fixed):**

- `AgentMessagesSanitizer` message normalize / same-id dedupe for reconnect gaps
- `update_room_list` no-op after `find_room` when the model still double-emits
- Re-trim loops that fight Intelligence reconnect replaying a stopped turn

Do not add new long-term transcript fixes in the UI. Prefer AG-UI (`stream-patch` / transcript filters) or Mastra memory/processors.
