"use client";

import { ErrorMessages } from "@repo/components";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export const AppErrorBoundary = ({ children }: AppErrorBoundaryProps) => {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div className="flex min-h-screen items-center justify-center bg-[#010507] p-6">
          <div className="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-card/70 p-6">
            <h1 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h1>
            <ErrorMessages error={error} />
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
