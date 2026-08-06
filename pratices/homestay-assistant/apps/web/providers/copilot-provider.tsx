"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  CopilotKitProvider,
  useCopilotKit,
  type CopilotKitProviderProps,
} from "@copilotkit/react-core/v2";

import { AGENT_URLS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { isExpectedAgentError } from "@/features/chat/utils/agent-run";
import { AppProvider } from "@/providers/app-provider";
import { AuthLoadingFallback } from "@/components/fallback";

type CopilotErrorEvent = Parameters<
  NonNullable<CopilotKitProviderProps["onError"]>
>[0];

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const TOKEN_REFRESH_MS = 50_000;
const CLERK_TOKEN_HEADER = "x-clerk-token";

const isLoginRoute = (pathname: string) =>
  pathname === ROUTES.LOGIN || pathname.startsWith(`${ROUTES.LOGIN}/`);

/**
 * Replaces CopilotKit's built-in fallback logger so Stop / thread reset does
 * not log as a failure. Aborting a pending human-in-the-loop card rejects its
 * handler, which CopilotKit emits as `tool_handler_failed` — expected, not an
 * error. Post-Stop Intelligence 409 (thread locked) is also expected until the
 * platform lock TTL expires. Everything else keeps the library's original format.
 */
const handleCopilotError = (event: CopilotErrorEvent) => {
  if (isExpectedAgentError(event.error, event.code, event.context)) {
    return;
  }

  console.error(
    `[CopilotKit] Error (${event.code}):`,
    event.error,
    event.context ?? {},
  );
};

/** Keeps rotating Clerk JWTs on an already-mounted CopilotKitProvider. */
const ClerkTokenSync = ({ initialToken }: { initialToken: string }) => {
  const { getToken } = useAuth();
  const { copilotkit } = useCopilotKit();
  const [token, setToken] = useState(initialToken);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const next = await getToken();

      if (!cancelled && next) {
        setToken(next);
      }
    };

    const id = window.setInterval(() => {
      void sync();
    }, TOKEN_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [getToken]);

  useEffect(() => {
    copilotkit.setHeaders({
      ...copilotkit.headers,
      [CLERK_TOKEN_HEADER]: token,
    });
  }, [copilotkit, token]);

  return null;
};

const CopilotKitProviders = ({ children }: CopilotKitProvidersProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [clerkToken, setClerkToken] = useState<string | null>(null);

  // Signing out flips isSignedIn before Clerk's own redirect lands, so the
  // previously-mounted page (bookings query, CopilotKit info fetch, etc.)
  // keeps running with a dead session and spams 401s. Bail out immediately.
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isLoginRoute(pathname)) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  // Resolve the JWT before mounting CopilotKitProvider so the first /info
  // request already carries x-clerk-token (ClerkTokenSync alone races that fetch).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setClerkToken(null);
      return;
    }

    let cancelled = false;

    const loadToken = async () => {
      const next = await getToken();

      if (!cancelled) {
        setClerkToken(next);
      }
    };

    void loadToken();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  // Stable reference — CopilotKitProvider's effect depends on `headers` and
  // re-runs setHeaders when the object identity changes every render.
  const headers = useMemo(
    () =>
      clerkToken ? { [CLERK_TOKEN_HEADER]: clerkToken } : null,
    [clerkToken],
  );

  // Login has no Copilot hooks. Keep QueryClient for any shared client pages.
  if (isLoginRoute(pathname)) {
    return <AppProvider withCopilot={false}>{children}</AppProvider>;
  }

  // MainLayout / chat children call useCopilotKit() unconditionally.
  // Wait for Clerk session AND the first JWT so /api/copilotkit/info is not
  // fired unauthenticated (which leaves the registry empty → "agent not found").
  if (!isLoaded || !isSignedIn || !clerkToken || !headers) {
    return (
      <AppProvider withCopilot={false}>
        <AuthLoadingFallback />
      </AppProvider>
    );
  }

  // CopilotKitProvider, not the v1-compat `CopilotKit` wrapper: that wrapper
  // strips `onError` before rendering the provider and only forwards it to a
  // cloud path that needs a publicApiKey, so the built-in console fallback can
  // never be replaced. Nothing here uses the v1 bridges it adds.
  return (
    <CopilotKitProvider
      credentials="include"
      runtimeUrl={AGENT_URLS.MANAGE_ASSISTANT}
      headers={headers}
      // Intelligence thread routes (/threads*) require REST transport.
      // Single-endpoint /info always reports threadEndpoints.list=false.
      useSingleEndpoint={false}
      onError={handleCopilotError}
    >
      <ClerkTokenSync initialToken={clerkToken} />
      <AppProvider>{children}</AppProvider>
    </CopilotKitProvider>
  );
};

export default CopilotKitProviders;
