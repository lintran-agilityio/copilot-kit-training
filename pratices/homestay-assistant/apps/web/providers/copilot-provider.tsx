"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CopilotKit, useCopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { AppProvider } from "@/providers/app-provider";
import { AuthLoadingFallback } from "@/components/fallback";

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const TOKEN_REFRESH_MS = 50_000;

const isLoginRoute = (pathname: string) =>
  pathname === ROUTES.LOGIN || pathname.startsWith(`${ROUTES.LOGIN}/`);

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
  const { isLoaded, userId } = useAuth();

  if (isLoginRoute(pathname) || !userId) {
    return children;
  }

  // Clerk is still initializing
  if (!isLoaded) {
    return <AuthLoadingFallback />;
  }

  return (
    <CopilotKit
      agent={AGENT_KEYS.MANAGE_ASSISTANT}
      credentials="include"
      runtimeUrl={AGENT_URLS.MANAGE_ASSISTANT}
    >
      <ClerkTokenSync />
      <AppProvider>{children}</AppProvider>
    </CopilotKit>
  );
};

export default CopilotKitProviders;
