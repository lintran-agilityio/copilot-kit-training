"use client";

import { useLayoutEffect } from "react";
import { useUser } from "@clerk/nextjs";

import { MainLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { RoomGrid } from "@/features/room/components/RoomGrid";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

type HomePageClientProps = {
  initialRooms: Room[];
};

const HomePageContent = ({ initialRooms }: HomePageClientProps) => {
  useLayoutEffect(() => {
    if (useRoomStore.getState().rooms.length === 0) {
      useRoomStore.getState().updateRoomList(initialRooms);
    }
  }, [initialRooms]);

  return (
    <MainLayout>
      <PageHeader />
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