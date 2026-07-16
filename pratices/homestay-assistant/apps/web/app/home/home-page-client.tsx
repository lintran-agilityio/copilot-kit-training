"use client";

import { useLayoutEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAgentContext } from "@copilotkit/react-core/v2";

import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { ScheduleCalendar } from "@/components/calendar";
import { RoomGrid } from "@/features/room/components";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

type HomePageClientProps = {
  initialRooms: Room[];
};

const HomePageContent = ({ initialRooms }: HomePageClientProps) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateKey = selectedDate.toISOString().slice(0, 10);

  useAgentContext({
    description:
      "The date currently selected on the calendar for room availability lookup (YYYY-MM-DD)",
    value: selectedDateKey,
  });

  useLayoutEffect(() => {
    if (useRoomStore.getState().rooms.length === 0) {
      useRoomStore.getState().updateRoomList(initialRooms);
    }
  }, [initialRooms]);

  return (
    <MainLayout>
      <PageHeader />
      <ScheduleCalendar
        initialDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <RoomGrid className="mt-8" initialRooms={initialRooms} />
    </MainLayout>
  );
};

const HomePageClient = ({ initialRooms }: HomePageClientProps) => {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return null;
  }

  return <HomePageContent initialRooms={initialRooms} />;
};

export default HomePageClient;