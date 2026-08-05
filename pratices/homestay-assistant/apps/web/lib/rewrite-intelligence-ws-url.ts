/**
 * Rewrites CopilotKit Intelligence realtime wsUrl to the same-origin proxy
 * served by apps/web/server.mjs.
 *
 * Localhost keeps the managed URL — Phoenix already allows that Origin.
 * Non-local hosts (e.g. Fly) must use the proxy so the browser Origin is
 * same-origin and the server spoofs localhost to the upstream gateway.
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
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded?.split(",")[0] ?? request.headers.get("host"))?.trim();

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

type RuntimeInfoBody = {
  intelligence?: {
    wsUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/** If this is a runtime /info JSON body, point intelligence.wsUrl at our proxy. */
export const rewriteIntelligenceWsUrlInInfoBody = (
  request: Request,
  body: unknown,
): unknown => {
  const proxyUrl = sameOriginIntelligenceClientWsUrl(request);

  if (!proxyUrl || !body || typeof body !== "object") {
    return body;
  }

  const info = body as RuntimeInfoBody;

  if (!info.intelligence || typeof info.intelligence !== "object") {
    return body;
  }

  return {
    ...info,
    intelligence: {
      ...info.intelligence,
      wsUrl: proxyUrl,
    },
  };
};

export const isCopilotKitInfoPath = (pathname: string, basePath: string): boolean => {
  const normalizedBase = basePath.replace(/\/$/, "");

  return (
    pathname === `${normalizedBase}/info` ||
    pathname.endsWith(`${normalizedBase}/info`)
  );
};
