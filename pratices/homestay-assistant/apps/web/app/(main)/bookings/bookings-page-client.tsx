"use client";

import { useQuery } from "@tanstack/react-query";

import { PREFIX_URL } from "@repo/types";
import { PageHeader } from "@/components/common";
import { BookingList } from "@/features/booking/components";
import { getMyBookings } from "@/features/booking/services";

const MY_BOOKINGS_TITLE = "Your reservations";

type BookingsPageClientProps = {
  userId: string;
};

export const BookingsPageClient = ({ userId }: BookingsPageClientProps) => {
  const {
    data: bookings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookings", userId],
    queryFn: () => getMyBookings({ via: PREFIX_URL.WEB, userId }),
  });

  return (
    <>
      <PageHeader label="MY BOOKINGS" title="Your reservations" />
      <BookingList
        bookings={bookings}
        title={MY_BOOKINGS_TITLE}
        className="mt-8"
        isLoading={isLoading}
        error={error ?? undefined}
      />
    </>
  );
};
