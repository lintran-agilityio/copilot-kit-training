"use client";

import { useLayoutEffect, useState } from "react";

import { NavbarTab } from "@repo/types";
import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { BookingList } from "@/features/booking/components";
import { useBookingsStore } from "@/features/booking/stores/bookings-store";
import type { BookingResponse } from "@/features/booking/types/booking";

const MY_BOOKINGS_TITLE = "Your reservations";

type BookingsPageClientProps = {
  bookings: BookingResponse[];
};

export const BookingsPageClient = ({ bookings }: BookingsPageClientProps) => {
  const [hydrated, setHydrated] = useState(false);
  const storeBookings = useBookingsStore((state) => state.bookings);

  useLayoutEffect(() => {
    useBookingsStore.getState().setBookings(bookings);
    setHydrated(true);
  }, [bookings]);

  const displayBookings = hydrated ? storeBookings : bookings;

  return (
    <MainLayout activeTab={NavbarTab.MY_BOOKINGS}>
      <PageHeader label="MY BOOKINGS" title="Your reservations" />
      <BookingList
        bookings={displayBookings}
        title={MY_BOOKINGS_TITLE}
        className="mt-8"
      />
    </MainLayout>
  );
};
