import { formatPrice, cn } from "@repo/utils";

type RoomBookingPricePerNightProps = {
  pricePerNight: number;
  size?: "sm" | "lg";
  className?: string;
};

export const RoomBookingPricePerNight = ({
  pricePerNight,
  size = "lg",
  className,
}: RoomBookingPricePerNightProps) => {
  return (
    <p
      className={cn(
        "font-medium text-emerald-300",
        size === "lg" ? "text-lg" : "text-sm",
        className,
      )}
    >
      {formatPrice(pricePerNight)}
      <span
        className={cn(
          "font-normal text-zinc-500",
          size === "lg" ? "text-sm" : "text-inherit",
        )}
      >
        {" "}
        / night
      </span>
    </p>
  );
};
