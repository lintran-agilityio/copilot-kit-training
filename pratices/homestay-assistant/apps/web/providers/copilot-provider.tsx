"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CopilotKit, ToolCallStatus } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { AppProvider } from "@/providers/app-provider";
import { Loading } from "@repo/components";

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const isLoginRoute = (pathname: string) =>
  pathname === ROUTES.LOGIN || pathname.startsWith(`${ROUTES.LOGIN}/`);

const CopilotKitProviders = ({ children }: CopilotKitProvidersProps) => {
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();

  if (isLoginRoute(pathname)) {
    return children;
  }

  if (!isLoaded || !userId) {
    return null;
  }

  return (
    <CopilotKit
      agent={AGENT_KEYS.MANAGE_ASSISTANT}
      credentials="include"
      runtimeUrl={AGENT_URLS.MANAGE_ASSISTANT}
      renderToolCalls={[
        {
          name: "*",
          render: ({ name, args, status, result }) => {
            console.log('status == ', status);
            if (status === ToolCallStatus.InProgress) {
              return (
                <div className="text-gray-500 text-sm">
                  <Loading />
                </div>
              );
            }
            return null;
          },
        },
      ]}
    >
      <AppProvider>{children}</AppProvider>
    </CopilotKit>
  );
};

export default CopilotKitProviders;
