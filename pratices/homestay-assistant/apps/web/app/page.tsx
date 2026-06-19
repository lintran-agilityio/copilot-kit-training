// Libs
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import HomePage from "./home/page";
import { ROUTES } from "@/constants";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect(ROUTES.LOGIN);
  }

  return <HomePage />;
}
