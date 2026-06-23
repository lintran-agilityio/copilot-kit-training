import { Users } from "lucide-react";

import { AmenitiesRoom } from "./AmenitiesRoom";
import type { Amenity } from "@/features/room/types/room";
import { cn } from "@repo/utils";

type RoomDetailsProps = {
  name: string;
  capacity: number;
  description: string;
  amenities: Amenity[];
  compact?: boolean;
  className?: string;
};

export const RoomDetails = ({
  name,
  capacity,
  description,
  amenities,
  compact = false,
  className,
}: RoomDetailsProps) => {
  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-medium text-white",
            compact ? "text-sm" : "text-base",
          )}
        >
          {name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5 text-zinc-400">
          <Users className="size-3.5" />
          <span className="text-xs">{capacity}</span>
        </div>
      </div>

      <p
        className={cn(
          "leading-relaxed text-zinc-500",
          compact ? "line-clamp-2 text-xs" : "line-clamp-3 text-sm",
        )}
      >
        {description}
      </p>

      <AmenitiesRoom amenities={amenities} />
    </div>
  );
}
