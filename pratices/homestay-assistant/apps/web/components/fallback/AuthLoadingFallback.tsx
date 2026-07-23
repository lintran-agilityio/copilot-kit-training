import { Loading } from "@repo/components";

export const AuthLoadingFallback = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <Loading />
      </div>
    </div>
  );
};
