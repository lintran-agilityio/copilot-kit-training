"use client";

import { ROUTES } from "@/constants";
import { useRouter } from "next/navigation";

/** Navigate home only when the guest is on the bookings page (not already on home). */
export const navigateToHomeIfNeeded = (
  pathname: string,
  router: ReturnType<typeof useRouter>,
) => {
  if (pathname === ROUTES.BOOKINGS) {
    router.push(ROUTES.HOME);
    return true;
  }

  return false;
};
