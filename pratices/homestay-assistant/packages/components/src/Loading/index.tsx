export const Loading = () => {
  return (
    <div className="space-y-2 px-2 py-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-sm bg-muted/60"
        />
      ))}
    </div>
  );
};
