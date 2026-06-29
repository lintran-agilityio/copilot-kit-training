import { getRooms } from "@/features/room/services";

import { HomePageClient } from "./home-page-client";

const HomePage = async () => {
  const rooms = await getRooms();

  return <HomePageClient initialRooms={rooms} />;
};

export default HomePage;
