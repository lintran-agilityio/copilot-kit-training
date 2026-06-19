"use client";

// Libs
import { useState } from "react";

import { GenerativeUIProvider } from "@/components/generative-ui/generative-ui-provider";
import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { ROOMS } from "@/data/rooms";
import { ListRoom } from "@/components/rooms";
import { ScheduleCalendar } from "@/components/calendar";

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  return (
    <>
      <GenerativeUIProvider />
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
