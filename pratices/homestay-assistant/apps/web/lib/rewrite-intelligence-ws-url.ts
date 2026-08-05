/**
 * Rewrites CopilotKit Intelligence realtime URLs to the same-origin proxy
 * served by apps/web/server.mjs.
 *
 * The runtime hands the browser a managed gateway URL in three responses:
 *   - `GET  /info`                    → `intelligence.wsUrl` (thread metadata socket)
 *   - `POST /agent/{id}/run`          → `realtime.clientUrl` (run socket)
 *   - `POST /agent/{id}/connect`      → `realtime.clientUrl` (resume socket)
 * All of them must point at the proxy: the managed gateway enforces a Phoenix
 * check_origin allowlist that only accepts localhost origins, so any other
 * browser Origin is rejected with 403 before auth is considered.
 *
 * Localhost keeps the managed URL — Phoenix already allows that Origin.
 */

const PROXY_SUFFIX = "/api/intelligence-realtime/client";

const isLocalHost = (host: string): boolean => {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
};

const publicHostFromRequest = (request: Request): string | null => {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || request.headers.get("host")?.trim();

  return host || null;
};

const wsProtocolFromRequest = (request: Request): "ws" | "wss" => {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwarded === "https" || forwarded === "http") {
    return forwarded === "https" ? "wss" : "ws";
  }

  return new URL(request.url).protocol === "https:" ? "wss" : "ws";
};

export const shouldProxyIntelligenceRealtime = (request: Request): boolean => {
  const host = publicHostFromRequest(request);

  if (!host) {
    return false;
  }

  return !isLocalHost(host);
};

export const sameOriginIntelligenceClientWsUrl = (request: Request): string | null => {
  const host = publicHostFromRequest(request);

  if (!host || isLocalHost(host)) {
    return null;
  }

  return `${wsProtocolFromRequest(request)}://${host}${PROXY_SUFFIX}`;
};

type IntelligenceRealtimeBody = {
  /** `/info` shape. */
  intelligence?: {
    wsUrl?: string;
    [key: string]: unknown;
  };
  /** `agent/{id}/run` and `agent/{id}/connect` join-credential envelope. */
  realtime?: {
    clientUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const hasStringField = (
  value: unknown,
  key: string,
): value is Record<string, unknown> =>
  !!value && typeof value === "object" && typeof (value as Record<string, unknown>)[key] === "string";

/**
 * Points every managed realtime URL in a runtime JSON body at our proxy.
 * Returns the original reference when there is nothing to rewrite.
 */
export const rewriteIntelligenceRealtimeUrlsInBody = (
  request: Request,
  body: unknown,
): unknown => {
  const proxyUrl = sameOriginIntelligenceClientWsUrl(request);

  if (!proxyUrl || !body || typeof body !== "object") {
    return body;
  }

  const payload = body as IntelligenceRealtimeBody;
  const rewritesInfo = hasStringField(payload.intelligence, "wsUrl");
  const rewritesRealtime = hasStringField(payload.realtime, "clientUrl");

  if (!rewritesInfo && !rewritesRealtime) {
    return body;
  }

  return {
    ...payload,
    ...(rewritesInfo
      ? { intelligence: { ...payload.intelligence, wsUrl: proxyUrl } }
      : {}),
    ...(rewritesRealtime
      ? { realtime: { ...payload.realtime, clientUrl: proxyUrl } }
      : {}),
  };
};
