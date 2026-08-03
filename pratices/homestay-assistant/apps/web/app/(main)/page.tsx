// Libs
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import HomePageClient from "./home/home-page-client";
import { ROUTES } from "@/constants";
import { getRooms } from "@/features/room/services";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect(ROUTES.LOGIN);
  }

  const rooms = await getRooms();

  return <HomePageClient initialRooms={rooms} />;
}
