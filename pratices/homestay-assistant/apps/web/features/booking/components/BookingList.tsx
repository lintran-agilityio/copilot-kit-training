import { BookingCard } from "@/features/booking/components/BookingCard";
import type { BookingResponse } from "@/features/booking/types/booking";
import { cn } from "@repo/utils";

type BookingListProps = {
  bookings: BookingResponse[];
  title?: string;
  className?: string;
};

export const BookingList = ({
  bookings,
  title,
  className,
}: BookingListProps) => {
  if (bookings.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-400">No bookings found</p>
      </div>
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
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </section>
  );
};
