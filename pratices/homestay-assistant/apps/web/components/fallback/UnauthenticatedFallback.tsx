export const UnauthenticatedFallback = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Authentication required</h1>
        <p className="mt-2 text-sm text-muted-foreground"> Please sign in to continue. </p>
      </div>
    </div>
  );
};
