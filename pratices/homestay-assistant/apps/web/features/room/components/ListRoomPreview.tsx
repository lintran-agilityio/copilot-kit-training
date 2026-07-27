import { Room } from "@/features/room/types";
import { ListRoom } from "@/features/room/components/ListRoom";

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
      className="max-w-full rounded-2xl border border-white/8 bg-white/[0.02] p-4"
    />
  );
};
