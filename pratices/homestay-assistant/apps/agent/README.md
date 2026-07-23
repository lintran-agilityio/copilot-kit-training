# Agent (`apps/agent`)

Mastra agents for Homestay Assistant. Tools call the Nest API for rooms and bookings; CopilotKit consumes the exported agents from the web app.

## Stack

- Mastra (`@mastra/core`, memory, observability, LibSQL / DuckDB storage)
- AG-UI Mastra adapter (`@ag-ui/mastra`)
- OpenAI models (e.g. `openai/gpt-4o-mini`)
- Shared packages: `@repo/constants`, `@repo/types`, `@repo/utils`

Requires Node.js `>=22.13.0`.

## Agents

Registered in `src/mastra/index.ts` (Studio) and `src/mastra/runtime.ts` (CopilotKit runtime):

| Agent | Key | Role |
| --- | --- | --- |
| Homestay Manager | manage assistant | Public chat agent: rooms + booking workflows |
| Suggestion | suggestion assistant | Chat suggestions / tool-choice helpers |

Additional specialist agents (e.g. homestay / booking) live under `src/mastra/agents/` and are composed into the manager flow via tools and prompts.

## Tools

| Domain | Tools |
| --- | --- |
| Rooms | `get_rooms`, `find_room`, `get_room_by_id` |
| Bookings | `check_room_availability`, `create_booking`, `get_bookings`, `find_booking_by_id`, `cancel_booking` |

Tool implementations call `API_URL` via services in `src/mastra/services/`.

## Exports

`package.json` exports used by `web`:

| Export | Path | Use |
| --- | --- | --- |
| `agent` | `./src/mastra/index.ts` | Mastra instance / Studio agents |
| `agent/copilotkit` | `./src/copilotkit.ts` | `getCopilotkitAgents(userId)` for the web runtime |

## Environment

```sh
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Required for model calls |
| `API_URL` | Nest API base URL (default `http://localhost:5001`) |
| `MASTRA_PLATFORM_ACCESS_TOKEN` | Optional — Mastra Platform observability |
| `MASTRA_PROJECT_ID` | Optional — Mastra Platform project |
| `OPENAI_TRACING` | Optional — tracing flag |

Ensure the **api** app is running before exercising tools that hit rooms/bookings.

## Run

From the monorepo root:

```sh
pnpm install
pnpm agent
```

Or from this directory:

```sh
pnpm dev
```

Mastra Studio: [http://localhost:4111](http://localhost:4111)

Other scripts:

```sh
pnpm build
pnpm start
```

Use the `dev` / `build` / `start` scripts from `package.json` (do not invoke `mastra` CLI flags ad hoc unless you know you need them). See [`AGENTS.md`](./AGENTS.md).

## Project layout

```
src/
  mastra/
    agents/        # manage, suggestion, specialists
    tools/         # rooms + booking tools
    schemas/       # Zod schemas for tool I/O
    services/      # HTTP clients against the Nest API
    constants/     # prompts, working-memory templates
    index.ts       # Studio Mastra instance
    runtime.ts     # CopilotKit runtime Mastra instance
  copilotkit.ts    # AG-UI agent export for web
```

## Docs

- [Mastra docs](https://mastra.ai/docs/)
- [Mastra Studio](https://mastra.ai/docs/studio/overview)
- Local agent rules: [`AGENTS.md`](./AGENTS.md)
