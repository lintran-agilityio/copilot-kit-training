"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { AppProvider } from "@/providers/app-provider";
import { AuthLoadingFallback } from "@/components/fallback";

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const isLoginRoute = (pathname: string) =>
  pathname === ROUTES.LOGIN || pathname.startsWith(`${ROUTES.LOGIN}/`);

const CopilotKitProviders = ({ children }: CopilotKitProvidersProps) => {
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();

  // Always provide QueryClient — pages like /bookings use useQuery even before
  // CopilotKit mounts (Clerk hydration can briefly report !userId).
  if (isLoginRoute(pathname)) {
    return <AppProvider withCopilot={false}>{children}</AppProvider>;
  }

  if (!isLoaded) {
    return (
      <AppProvider withCopilot={false}>
        <AuthLoadingFallback />
      </AppProvider>
    );
  }

  if (!userId) {
    return <AppProvider withCopilot={false}>{children}</AppProvider>;
  }

  return (
    <CopilotKit
      agent={AGENT_KEYS.MANAGE_ASSISTANT}
      credentials="include"
      runtimeUrl={AGENT_URLS.MANAGE_ASSISTANT}
    >
      <AppProvider>{children}</AppProvider>
    </CopilotKit>
  );
};

export default CopilotKitProviders;
