import type { ReactNode } from "react";

import { cn } from "@repo/utils";

const CHAT_GENERATIVE_INNER_CLASS =
  "mx-auto w-full max-w-[min(100%,360px)]";

type ChatGenerativeUILayoutProps = {
  children: ReactNode;
  className?: string;
};

export const ChatGenerativeUILayout = ({
  children,
  className,
}: ChatGenerativeUILayoutProps) => (
  <div className="w-full px-4">
    <div className={cn(CHAT_GENERATIVE_INNER_CLASS, className)}>{children}</div>
  </div>
);
