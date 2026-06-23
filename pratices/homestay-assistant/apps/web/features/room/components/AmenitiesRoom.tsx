// Libs
import {
  Coffee,
  Mic,
  Monitor,
  Phone,
  Presentation,
  Wifi,
  type LucideIcon,
} from "lucide-react";

// Types
import type { Amenity } from "@/features/room/types/room";
import { cn } from "@repo/utils";;

const AMENITY_ICONS: Record<Amenity, LucideIcon> = {
  monitor: Monitor,
  coffee: Coffee,
  mic: Mic,
  wifi: Wifi,
  video: Presentation,
  whiteboard: Presentation,
  phone: Phone,
};

type AmenitiesRoomProps = {
  amenities: Amenity[];
  className?: string;
};

export const AmenitiesRoom = ({ amenities, className }: AmenitiesRoomProps) => {
  return (
    <div className={cn("flex items-center gap-3 text-zinc-500", className)}>
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity];
        return (
          <Icon
            key={amenity}
            className="size-4 stroke-[1.5]"
            aria-label={amenity}
          />
        );
      })}
    </div>
  );
}
