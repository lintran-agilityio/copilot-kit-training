# Deploy on Render

Deploy each app as its own Render **Web Service**, sharing one Git repo and one Postgres database. Blueprint config lives in [`render.yaml`](../render.yaml) at the monorepo root.

## Architecture on Render

| Service | Blueprint name | Role |
| --- | --- | --- |
| Postgres | `homestay-db` | Rooms / bookings data |
| Web Service | `homestay-api` | NestJS REST API |
| Web Service | `homestay-web` | Next.js UI + CopilotKit (Mastra agents run **in-process** via workspace package `agent`) |
| Web Service | `homestay-agent` | Optional Mastra Studio / `mastra start` |

Chat does **not** require `homestay-agent`. The web app imports `agent/copilotkit` at build/runtime. Keep `homestay-agent` only if you want Studio or a standalone Mastra HTTP server.

All services must use **repo root** as the working directory so `pnpm` workspaces and Turbo `--filter` resolve `@repo/*` and `agent`.

---

## Option A — Blueprint (recommended)

### 1. Push the repo

Ensure `render.yaml` is on the branch you will deploy (usually `main`).

### 2. Create Blueprint on Render

1. Open [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
2. Connect the GitHub/GitLab repo that contains this monorepo.
3. Select the branch with `render.yaml`.
4. Review services: `homestay-db`, `homestay-api`, `homestay-web`, `homestay-agent`.
5. Fill secrets prompted by `sync: false`:
   - **web**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`
   - **agent**: `OPENAI_API_KEY`
6. Apply / create the Blueprint.
7. (Optional) On `homestay-agent`, add `MASTRA_PLATFORM_ACCESS_TOKEN` / `MASTRA_PROJECT_ID` in the Dashboard if you use Mastra Platform observability.

### 3. Wait for `api` + database first

1. Confirm `homestay-db` is available.
2. Confirm `homestay-api` build succeeds.
3. Confirm the API start log ran migrate (`pnpm --filter api db:migrate` before `start:prod`). Free tier does not support Render pre-deploy commands.
4. Open `https://<homestay-api>.onrender.com/` — health JSON should respond.
5. Open `https://<homestay-api>.onrender.com/api` — Swagger UI.

### 4. Seed the database (once)

From Render → `homestay-api` → **Shell** (or a one-off job):

```sh
pnpm --filter api db:seed
```

### 5. Finish `web`

1. In Clerk Dashboard, add the web URL to allowed origins / redirect URLs, e.g. `https://<homestay-web>.onrender.com` and sign-in paths.
2. Confirm `API_URL` on `homestay-web` equals the API public URL (`RENDER_EXTERNAL_URL` of `homestay-api`).
3. Open `https://<homestay-web>.onrender.com/login` and sign in.
4. Smoke-test chat, rooms, and bookings.

### 6. Optional — `agent`

1. Confirm `API_URL` points at `homestay-api`.
2. Open the agent service URL (Mastra Studio / server).
3. Skip this service entirely if you only need the chat UI.

---

## Option B — Manual (one service at a time)

Use this if you prefer creating services in the dashboard without Blueprint.

### Shared settings (every Node service)

| Field | Value |
| --- | --- |
| Repository | This monorepo |
| Root Directory | leave empty (repo root) |
| Runtime | Node |
| Node version | `22.13.0` (env `NODE_VERSION=22.13.0`) |
| Package manager | detected via root `packageManager` (`pnpm@11.9.0`) |

---

### B1. Postgres

1. **New** → **Postgres**.
2. Name: e.g. `homestay-db`.
3. Plan: Free (or paid).
4. Create → copy **Internal Database URL** (or External if you need local tools).

---

### B2. API (`homestay-api`)

1. **New** → **Web Service** → select repo.
2. Name: `homestay-api`.
3. Build command:

   ```sh
   pnpm install --frozen-lockfile && pnpm exec turbo build --filter=api
   ```

4. Start command (migrate inline — free tier cannot use pre-deploy commands):

   ```sh
   pnpm --filter api db:migrate && pnpm --filter api start:prod
   ```

5. Health check path: `/`
6. Environment:

   | Key | Value |
   | --- | --- |
   | `NODE_VERSION` | `22.13.0` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | From Postgres (link the DB or paste connection string) |

7. Deploy → wait until live.
8. Shell: `pnpm --filter api db:seed`
9. Note the public URL, e.g. `https://homestay-api.onrender.com`.

---

### B3. Web (`homestay-web`)

1. **New** → **Web Service** → same repo.
2. Name: `homestay-web`.
3. Build command:

   ```sh
   pnpm install --frozen-lockfile && pnpm exec turbo build --filter=web
   ```

4. Start command:

   ```sh
   pnpm --filter web start
   ```

5. Health check path: `/login`
6. Environment:

   | Key | Value |
   | --- | --- |
   | `NODE_VERSION` | `22.13.0` |
   | `NODE_ENV` | `production` |
   | `API_URL` | `https://<homestay-api>.onrender.com` (no trailing slash) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | from Clerk |
   | `CLERK_SECRET_KEY` | from Clerk |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
   | `OPENAI_API_KEY` | from OpenAI |
   | `MASTRA_DB_PATH` | optional; see [SQLite note](#sqlite--thread-storage) |

7. Update Clerk allowed URLs for the Render web hostname.
8. Deploy → test login and chat.

---

### B4. Agent (`homestay-agent`) — optional

1. **New** → **Web Service** → same repo.
2. Name: `homestay-agent`.
3. Build command:

   ```sh
   pnpm install --frozen-lockfile && pnpm exec turbo build --filter=agent
   ```

4. Start command:

   ```sh
   pnpm --filter agent start
   ```

5. Environment:

   | Key | Value |
   | --- | --- |
   | `NODE_VERSION` | `22.13.0` |
   | `NODE_ENV` | `production` |
   | `API_URL` | `https://<homestay-api>.onrender.com` |
   | `OPENAI_API_KEY` | from OpenAI |
   | `MASTRA_PLATFORM_ACCESS_TOKEN` | optional |
   | `MASTRA_PROJECT_ID` | optional |

6. Deploy only if you need Mastra Studio / standalone server.

---

## Checklist

- [ ] Postgres created and linked to `homestay-api`
- [ ] `api` build + migrate succeeded
- [ ] `api` seed ran once
- [ ] `API_URL` on `web` (and `agent` if used) points at public API URL
- [ ] Clerk keys + redirect URLs updated for Render web URL
- [ ] `OPENAI_API_KEY` set on `web` (and `agent` if used)
- [ ] `web` `/login` works; chat can list rooms / create booking
- [ ] (Optional) `agent` service healthy

---

## Notes / gotchas

### Monorepo build

Always install and build from the **repo root** with Turbo filters. Do not set Root Directory to `apps/web` etc., or workspace packages will fail to resolve.

### Free tier

Free web services **spin down** after idle traffic; first request can be slow. Upgrade plan if you need always-on.

### SQLite / thread storage

`web` uses `better-sqlite3` for Mastra thread storage. Render’s filesystem is **ephemeral** unless you attach a **Persistent Disk** (paid). Without a disk, thread history may reset on redeploy/restart. For durable threads, attach a disk and set e.g. `MASTRA_DB_PATH=/var/data/mastra.db` (mount path must match the disk).

### CORS

The Nest API currently has no CORS config. That is fine while `web` calls the API **server-side** via `API_URL`. If the browser calls the API domain directly later, enable CORS on the API.

### Region

`render.yaml` uses `singapore`. Change `region` in the Blueprint (or dashboard) if you prefer another Render region; keep DB and services in the **same** region.
