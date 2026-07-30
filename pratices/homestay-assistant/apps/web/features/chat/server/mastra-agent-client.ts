import { AGENT_ID_HEADER, CLERK_TOKEN_HEADER } from "agent/middleware";

export class MastraAgentError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "MastraAgentError";
  }
}

const DEFAULT_AGENT_BASE_URL = "http://localhost:4111";

const normalizeAgentBaseUrl = (value: string) =>
  value.replace(/\/$/, "").replace("://localhost", "://127.0.0.1");

export const getAgentBaseUrl = () =>
  normalizeAgentBaseUrl(process.env.MASTRA_URL ?? DEFAULT_AGENT_BASE_URL);

export class MastraAgentUnavailableError extends Error {
  constructor(message = "Mastra agent is unavailable") {
    super(message);
    this.name = "MastraAgentUnavailableError";
  }
}

export const isAgentConnectionError = (error: unknown) =>
  error instanceof TypeError &&
  (error.message === "fetch failed" ||
    (error.cause as NodeJS.ErrnoException | undefined)?.code === "ECONNREFUSED");

const AGENT_FETCH_MAX_ATTEMPTS = 8;
const AGENT_FETCH_RETRY_DELAY_MS = 1_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isReplayableBody = (body: BodyInit | null | undefined) =>
  body == null ||
  typeof body === "string" ||
  body instanceof ArrayBuffer ||
  ArrayBuffer.isView(body);

/** Retries on ECONNREFUSED — covers Mastra dev server restarts (~7s). */
export const fetchAgent = async (
  url: string | URL,
  init?: RequestInit,
): Promise<Response> => {
  const maxAttempts =
    init?.body != null && !isReplayableBody(init.body)
      ? 1
      : AGENT_FETCH_MAX_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;

      if (!isAgentConnectionError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      await sleep(AGENT_FETCH_RETRY_DELAY_MS);
    }
  }

  throw lastError;
};

export const agentUnavailableMessage = () =>
  `Mastra agent is unavailable at ${getAgentBaseUrl()}. Start it with: pnpm agent`;

type MastraAgentRequestInput = {
  clerkToken: string;
  agentId: string;
  path: string;
  method?: "GET" | "PATCH" | "DELETE" | "POST";
  searchParams?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
};

export const mastraAgentRequest = async <T>({
  clerkToken,
  agentId,
  path,
  method = "GET",
  searchParams,
  body,
}: MastraAgentRequestInput): Promise<T> => {
  const url = new URL(`${getAgentBaseUrl()}/api${path}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;

  try {
    response = await fetchAgent(url, {
      method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${clerkToken}`,
        [CLERK_TOKEN_HEADER]: clerkToken,
        [AGENT_ID_HEADER]: agentId,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (isAgentConnectionError(error)) {
      throw new MastraAgentUnavailableError(agentUnavailableMessage());
    }

    throw error;
  }

  if (!response.ok) {
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }

    throw new MastraAgentError(
      `Mastra agent request failed: ${response.status}`,
      response.status,
      errorBody,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as T | { data: T };

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data: T }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};
