type RoomBookingEstimatedTotalProps = {
  estimatedTotal: string | null;
  className?: string;
};

export const RoomBookingEstimatedTotal = ({
  estimatedTotal,
  className,
}: RoomBookingEstimatedTotalProps) => {
  if (!estimatedTotal) {
    return null;
  }

  return (
    <div className={className ?? "flex items-center justify-between text-sm"}>
      <span className="text-zinc-500">Estimated total</span>
      <span className="font-medium text-emerald-300">{estimatedTotal}</span>
    </div>
  );
};
