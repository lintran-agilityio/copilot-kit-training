import { ROUTES } from "@repo/constants";

import { PREFIX_URL } from "@repo/types";
import { getBaseUrl } from "@/utils";

import type {
  CheckRoomAvailabilityInput,
  CheckRoomAvailabilityResult,
} from "../types/availability";

type CheckRoomAvailabilityProps = CheckRoomAvailabilityInput & {
  via?: PREFIX_URL;
};

export const checkRoomAvailability = async ({
  via = PREFIX_URL.WEB,
  roomId,
  checkInDate,
  checkOutDate,
}: CheckRoomAvailabilityProps): Promise<CheckRoomAvailabilityResult> => {
  const params = new URLSearchParams({
    roomId,
    checkInDate,
    checkOutDate,
  });
  const baseUrl = getBaseUrl(via);
  const response = await fetch(
    `${baseUrl}${ROUTES.BOOKING_AVAILABILITY}?${params}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to check room availability");
  }

  return (await response.json()) as CheckRoomAvailabilityResult;
};
