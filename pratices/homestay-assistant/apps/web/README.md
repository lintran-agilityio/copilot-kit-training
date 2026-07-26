# Web (`apps/web`)

Next.js frontend for Homestay Assistant. Guests sign in with Clerk, chat with the CopilotKit assistant, and interact with generative UI for rooms and bookings.

## Stack

- Next.js 16 (App Router)
- CopilotKit (`@copilotkit/react-core`, `@copilotkit/runtime`)
- Clerk (`@clerk/nextjs`)
- TanStack Query, Zustand
- Tailwind CSS 4, Radix / shadcn-style UI
- Shared packages: `@repo/components`, `@repo/constants`, `@repo/types`, `@repo/utils`
- Remote Mastra agent via `MASTRA_URL` (CopilotKit + Memory threads)

## Features

| Area | Location | Role |
| --- | --- | --- |
| Assistant UI | `features/assistant-ui` | Chat shell, suggestions, agent context |
| Threads | `features/threads` | Thread list, create/switch/rename/delete |
| Rooms | `features/room` | Room list/detail UI + stores |
| Bookings | `features/booking` | Booking flows + stores |
| Generative UI | `features/ai-elements` | Tool renderers (rooms, availability, etc.) |
| BFF routes | `app/api/*` | Proxy to Nest API + CopilotKit runtime + threads |

App routes include `/` (home/chat), `/login`, `/home`, and `/bookings`.

## Prerequisites

- Node.js `>=18`
- Running **api** (default `http://localhost:5001`) for room/booking data
- OpenAI API key (CopilotKit / agent)
- Clerk app (publishable + secret keys)

## Environment

Create `apps/web/.env` (there is no checked-in `.env.example` yet):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
OPENAI_API_KEY=sk-...
API_URL=http://localhost:5001
MASTRA_URL=http://localhost:4111
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Clerk auth |
| `OPENAI_API_KEY` | Model access for the assistant runtime |
| `API_URL` | Nest API base URL (defaults to `http://localhost:5001`) |
| `MASTRA_URL` | Mastra agent base URL for CopilotKit + thread Memory API |

## Run

From the monorepo root:

```sh
pnpm install
pnpm web
```

Or from this directory:

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```sh
pnpm build
pnpm start
pnpm lint
pnpm check-types
```

## Deploy on Render (manual)

Full steps: [`docs/deploy-render.md`](../../docs/deploy-render.md).

| Setting | Value |
| --- | --- |
| **Root Directory** | Leave **empty** (repo root). Do **not** set `apps/web` — `agent` / `@repo/*` will break |
| **Build Command** | `pnpm install --frozen-lockfile --filter=web... && NODE_OPTIONS=--max-old-space-size=450 pnpm exec turbo build --filter=web --concurrency=1` |
| **Start Command** | `pnpm --filter web start` |
| **`NODE_OPTIONS`** | Only in the **Build Command** above — do **not** set it as a Render Environment variable |

## API routes (BFF)

| Route | Purpose |
| --- | --- |
| `/api/copilotkit/[[...slug]]` | CopilotKit runtime → Mastra agents |
| `/api/rooms` | Proxy room listing/detail to Nest API |
| `/api/bookings` | Proxy bookings |
| `/api/bookings/availability` | Availability checks |
| `/api/bookings/[id]` | Booking by id |
| `/api/threads` | Thread list/create |
| `/api/threads/[threadId]` | Thread update/delete |
| `/api/threads/[threadId]/messages` | Thread messages |

## Project layout

```
app/                 # Next.js App Router pages + API routes
components/          # App-level UI (layouts, suggestions, etc.)
features/            # Domain features (assistant, threads, room, booking, ai-elements)
providers/           # CopilotKit + app providers
utils/               # Helpers (e.g. API URL)
```
