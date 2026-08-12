"use client";

import { useAgent } from "@copilotkit/react-core/v2";

import { EmptyMessages } from "@repo/components";
import { AGENT_KEYS } from "@repo/constants";
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
  compact?: boolean;
};

export const BookingList = ({
  bookings,
  title,
  className,
  isLoading,
  error,
  compact = false,
}: BookingListProps) => {
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
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
      <section className={cn("space-y-4 flex items-center justify-center h-full", className)}>
        <EmptyMessages emptyMessage="No bookings found" />
      </section>
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

      <div
        className={cn(
          "app-scrollbar grid",
          compact
            ? "max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto pr-1"
            : "grid-cols-1 gap-4 pb-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            compact={compact}
            isAgentRunning={agent.isRunning}
            onCancelBooking={cancelBooking}
            onModifyBooking={modifyBooking}
          />
        ))}
      </div>
    </section>
  );
};
