"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  CopilotKitProvider,
  useCopilotKit,
  type CopilotKitProviderProps,
} from "@copilotkit/react-core/v2";

import { AGENT_URLS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { isStopRelatedAgentError } from "@/features/chat/utils/agent-run";
import { AppProvider } from "@/providers/app-provider";
import { AuthLoadingFallback } from "@/components/fallback";

type CopilotErrorEvent = Parameters<
  NonNullable<CopilotKitProviderProps["onError"]>
>[0];

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const TOKEN_REFRESH_MS = 50_000;

const isLoginRoute = (pathname: string) =>
  pathname === ROUTES.LOGIN || pathname.startsWith(`${ROUTES.LOGIN}/`);

/**
 * Replaces CopilotKit's built-in fallback logger so Stop / thread reset does
 * not log as a failure. Aborting a pending human-in-the-loop card rejects its
 * handler, which CopilotKit emits as `tool_handler_failed` — expected, not an
 * error. Everything else keeps the library's original console format.
 */
const handleCopilotError = (event: CopilotErrorEvent) => {
  if (isStopRelatedAgentError(event.error, event.code, event.context)) {
    return;
  }

  console.error(
    `[CopilotKit] Error (${event.code}):`,
    event.error,
    event.context ?? {},
  );
};

/** Syncs Clerk session JWT into CopilotKit request headers (rotating tokens). */
const ClerkTokenSync = () => {
  const { getToken } = useAuth();
  const { copilotkit } = useCopilotKit();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const next = await getToken();

      if (!cancelled) {
        setToken(next);
      }
    };

    void sync();

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
      "x-clerk-token": token ?? "",
    });
  }, [copilotkit, token]);

  return null;
};

const CopilotKitProviders = ({ children }: CopilotKitProvidersProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  // Signing out flips isSignedIn before Clerk's own redirect lands, so the
  // previously-mounted page (bookings query, CopilotKit info fetch, etc.)
  // keeps running with a dead session and spams 401s. Bail out immediately.
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isLoginRoute(pathname)) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  // Login has no Copilot hooks. Keep QueryClient for any shared client pages.
  if (isLoginRoute(pathname)) {
    return <AppProvider withCopilot={false}>{children}</AppProvider>;
  }

  // MainLayout / chat children (SuggestionBar, ChatSidebarContent, booking
  // hooks, etc.) call useCopilotKit() unconditionally, so CopilotKit must be
  // mounted as soon as auth is resolved. Gate on isLoaded and isSignedIn —
  // userId can legitimately lag isLoaded during Clerk hydration, and server
  // pages already redirect unauthenticated users to login before this mounts,
  // but a client-side sign-out only surfaces through isSignedIn.
  if (!isLoaded || !isSignedIn) {
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
      // Intelligence thread routes (/threads*) require REST transport.
      // Single-endpoint /info always reports threadEndpoints.list=false.
      useSingleEndpoint={false}
      onError={handleCopilotError}
    >
      <ClerkTokenSync />
      <AppProvider>{children}</AppProvider>
    </CopilotKitProvider>
  );
};

export default CopilotKitProviders;
