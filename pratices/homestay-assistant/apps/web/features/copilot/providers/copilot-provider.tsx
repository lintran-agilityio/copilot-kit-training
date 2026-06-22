"use client";

import { CopilotContexts } from "../contexts";
import { GenerativeUIProvider } from "./generative-ui-provider";

type CopilotProviderProps = {
  children: React.ReactNode;
};

export const CopilotProvider = ({ children }: CopilotProviderProps) => {
  return (
    <>
      <CopilotContexts />
      <GenerativeUIProvider />
      {children}
    </>
  )
}
