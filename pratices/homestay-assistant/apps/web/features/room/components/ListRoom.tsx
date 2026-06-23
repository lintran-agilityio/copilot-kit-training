import { Room } from "@/features/room/components/Room";
import type { Room as RoomType } from "@/features/room/types/room";
import { cn } from "@repo/utils";;

type ListRoomProps = {
  rooms: RoomType[];
  title?: string;
  compact?: boolean;
  className?: string;
};

export const ListRoom = ({
  rooms,
  title,
  compact = false,
  className,
}: ListRoomProps) => {
  if (rooms.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      {title ? (
        <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
      ) : null}

      <div
        className={cn(
          compact
            ? "flex flex-col gap-3"
            : "flex flex-wrap gap-4 justify-center",
        )}
      >
        {rooms.map((room) => (
          <Room key={room.id} {...room} compact={compact} />
        ))}
      </div>
    </section>
  );
}
