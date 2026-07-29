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

| Setting | Value |
| --- | --- |
| **Root Directory** | `pratices/homestay-assistant` (this app folder in the parent repo). Do **not** set `apps/web` — workspace packages will break |
| **Build Command** | see below |
| **Start Command** | `pnpm --filter web start` |
| **`NODE_OPTIONS`** | Only inside the **Build Command** — do **not** set it as a Render Environment variable |

**Build Command** (forces a real `next build` so `.next` exists for `next start`):

```sh
pnpm install --frozen-lockfile --filter=web... && NODE_OPTIONS=--max-old-space-size=384 pnpm --filter @repo/utils build && NODE_OPTIONS=--max-old-space-size=384 pnpm --filter web build
```

If build still OOMs on Free/Starter (512Mi), upgrade the service RAM — Next 16 + CopilotKit often needs ≥1GB for webpack.

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
