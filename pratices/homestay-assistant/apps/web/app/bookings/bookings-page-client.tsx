"use client";

import { useLayoutEffect } from "react";

import { NavbarTab } from "@repo/types";
import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { RoomGrid } from "@/features/room/components";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

const BOOKED_ROOMS_TITLE = "Room are booked";

type BookingsPageClientProps = {
  bookedRooms: Room[];
};

export const BookingsPageClient = ({ bookedRooms }: BookingsPageClientProps) => {
  useLayoutEffect(() => {
    useRoomStore.getState().updateRoomList(bookedRooms, BOOKED_ROOMS_TITLE);
  }, [bookedRooms]);

  return (
    <MainLayout activeTab={NavbarTab.MY_BOOKINGS}>
      <PageHeader label="MY BOOKINGS" title="Your reservations" />
      <RoomGrid className="mt-8" initialRooms={bookedRooms} />
    </MainLayout>
  );
};
