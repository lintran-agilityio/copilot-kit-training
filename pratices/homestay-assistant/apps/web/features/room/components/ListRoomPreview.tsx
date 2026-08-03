import { Room } from "@/features/room/types";
import { ListRoom } from "@/features/room/components";

type ListRoomPreviewProps = {
  rooms?: Room[];
  title?: string;
};

export const ListRoomPreview = ({ rooms = [], title }: ListRoomPreviewProps) => {
  return (
    <ListRoom
      rooms={rooms}
      title={title ?? "Room results"}
      compact
      className="max-w-full rounded-xl border border-white/12 bg-[#111111] p-3.5"
    />
  );
};
