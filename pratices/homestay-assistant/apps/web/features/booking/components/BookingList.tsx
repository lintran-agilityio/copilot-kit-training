import { EmptyMessages } from "@repo/components";
import { BookingCard } from "@/features/booking/components/BookingCard";
import type { BookingResponse } from "@/features/booking/types/booking";
import { cn } from "@repo/utils";
import {
  useCancelBooking,
  useModifyBooking,
} from "@/features/booking/hooks/use-booking";
import { RoomListSkeleton } from "@/components/common";

type BookingListProps = {
  bookings: BookingResponse[];
  title?: string;
  className?: string;
  isLoading?: boolean;
  error?: Error;
};

export const BookingList = ({
  bookings,
  title,
  className,
  isLoading,
  error,
}: BookingListProps) => {
  const cancelBooking = useCancelBooking();
  const modifyBooking = useModifyBooking();

  if (isLoading) {
    return (
       <RoomListSkeleton className={className} />
    );
  }
  
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <EmptyMessages emptyMessage="No bookings found" />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      {title ? (
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          <h2 className="text-lg font-medium text-zinc-300">{title}</h2>
        </div>
      ) : null}

      <div className="app-scrollbar flex flex-wrap gap-4 overflow-x-auto pb-1">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onCancelBooking={cancelBooking}
            onModifyBooking={modifyBooking}
          />
        ))}
      </div>
    </section>
  );
};
