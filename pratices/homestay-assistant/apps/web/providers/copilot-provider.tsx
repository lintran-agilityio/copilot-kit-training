"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { ROUTES } from "@/constants";
import { AppProvider } from "@/providers/app-provider";
import { AuthLoadingFallback } from "@/components/fallback";

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const AuthenticatedCopilotShell = dynamic(
  () =>
    import("@/providers/authenticated-copilot-shell").then(
      (mod) => mod.AuthenticatedCopilotShell,
    ),
  {
    ssr: false,
    loading: () => (
      <AppProvider withCopilot={false}>
        <AuthLoadingFallback />
      </AppProvider>
    ),
  },
);

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

  return <AuthenticatedCopilotShell>{children}</AuthenticatedCopilotShell>;
};

export default CopilotKitProviders;
