"use client";

import { usePathname } from "next/navigation";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";

import { ROUTES } from "@/constants";

export const PageReadable = () => {
  const pathname = usePathname();

  const contextValue = useMemo(() => {
    const isHomePage = pathname === ROUTES.HOME;
    const isBookingsPage = pathname === ROUTES.BOOKINGS;

    return {
      pathname,
      isHomePage,
      isBookingsPage,
      page:
        isHomePage ? "home" : isBookingsPage ? "bookings" : "other",
    };
  }, [pathname]);

  useAgentContext({
    description:
      "Current app page. Call navigate_to_home_page only when isBookingsPage is true (guest is on /bookings). Skip it when isHomePage is true — update_room_list is enough.",
    value: contextValue,
  });

  return null;
};
