"use client";

import { ROUTES } from "@/constants";
import { useRouter } from "next/navigation";

export const navigateToHomeIfNeeded = (
  pathname: string,
  router: ReturnType<typeof useRouter>,
) => {
  if (pathname === ROUTES.BOOKINGS) {
    router.push(ROUTES.HOME);
  }
};
