import { getRooms } from "@/features/room/services";

import { HomePageClient } from "@/app/home/home-page-client";

const HomePage = async () => {
  const rooms = await getRooms();

  return <HomePageClient initialRooms={rooms} />;
};

export default HomePage;
