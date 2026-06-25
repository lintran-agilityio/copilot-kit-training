import { getRoomsServer } from "@/features/room/services/get-rooms-server";

import { HomePageClient } from "./home-page-client";

const HomePage = async () => {
  const rooms = await getRoomsServer();

  return <HomePageClient initialRooms={rooms} />;
};

export default HomePage;
