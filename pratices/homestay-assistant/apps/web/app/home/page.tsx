"use client";

// Libs
import { useState } from "react";

import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { ROOMS } from "@/data/rooms";
import { ListRoom } from "@/features/room/components";
import { ScheduleCalendar } from "@/components/calendar";

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  return (
    <>
      <MainLayout>
        <PageHeader />
        <ScheduleCalendar
          initialDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <ListRoom rooms={ROOMS} />
      </MainLayout>
    </>
  );
};

export default HomePage;
