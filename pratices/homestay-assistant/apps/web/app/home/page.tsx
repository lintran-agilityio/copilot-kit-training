"use client";

import { useState } from "react";
import { useAgentContext } from "@copilotkit/react-core/v2";

import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { ScheduleCalendar } from "@/components/calendar";
import { AgentRoomList } from "@/features/room/generative";
import { RoomLoadMode } from "@/features/room/types/room";

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateKey = selectedDate.toISOString().slice(0, 10);

  useAgentContext({
    description:
      "The date currently selected on the calendar for room availability lookup (YYYY-MM-DD)",
    value: selectedDateKey,
  });

  return (
    <MainLayout>
      <PageHeader />
      <ScheduleCalendar
        initialDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <AgentRoomList
        className="mt-8"
        mode={RoomLoadMode.ALL}
        selectedDate={selectedDateKey}
      />
    </MainLayout>
  );
};

export default HomePage;
