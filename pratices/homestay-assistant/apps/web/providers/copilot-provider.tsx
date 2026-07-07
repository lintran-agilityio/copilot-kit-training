"use client";

import { usePathname } from "next/navigation";
import { CopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { AppProvider } from "./app-provider";

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const isLoginRoute = (pathname: string) =>
  pathname === ROUTES.LOGIN || pathname.startsWith(`${ROUTES.LOGIN}/`);

const CopilotKitProviders = ({ children }: CopilotKitProvidersProps) => {
  const pathname = usePathname();

  if (isLoginRoute(pathname)) {
    return children;
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
