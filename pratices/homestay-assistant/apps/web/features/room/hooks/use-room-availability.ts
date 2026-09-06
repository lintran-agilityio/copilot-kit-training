"use client";

import { useEffect, useRef, useState } from "react";

import { isCheckOutAfterCheckIn } from "@repo/utils";

import { checkRoomAvailability } from "@/features/booking/services/check-room-availability";
import type { BookingUnavailableReason } from "@repo/schemas";

type UseRoomAvailabilityArgs = {
  roomId: string | null | undefined;
  checkInDate: string | null;
  checkOutDate: string | null;
  guests: number;
  /** Skip the network check (e.g. read-only / locked forms). */
  enabled?: boolean;
};

export type RoomAvailabilityState = {
  isChecking: boolean;
  /** `null` until the first result for the CURRENT stay lands — never a stale value. */
  isAvailable: boolean | null;
  guestsWithinCapacity: boolean | null;
  reason: BookingUnavailableReason | null;
};

type CachedResult = Omit<RoomAvailabilityState, "isChecking">;

const IDLE: RoomAvailabilityState = {
  isChecking: false,
  isAvailable: null,
  guestsWithinCapacity: null,
  reason: null,
};

const DEBOUNCE_MS = 300;

const resultReason = (
  isAvailable: boolean,
  guestsWithinCapacity: boolean,
): BookingUnavailableReason | null => {
  if (!guestsWithinCapacity) return "capacity_exceeded";
  if (!isAvailable) return "dates_unavailable";
  return null;
};

/**
 * Client-side availability check for the Booking Form — the CREATE flow's
 * replacement for a `check_room_availability` tool call. Hits the same
 * `/api/bookings/availability` route the agent uses.
 *
 * Deliberately non-blocking for date selection:
 *   - each unique stay is checked at most once (cached for the form's lifetime)
 *   - a stay change resets to `isAvailable: null` immediately, so the "Book"
 *     button and any error text clear the instant the guest picks a new date —
 *     they only reappear if the fresh check confirms that date is taken too
 *   - `create_booking` still re-checks server-side as the final gate
 */
export const useRoomAvailability = ({
  roomId,
  checkInDate,
  checkOutDate,
  guests,
  enabled = true,
}: UseRoomAvailabilityArgs): RoomAvailabilityState => {
  const [state, setState] = useState<RoomAvailabilityState>(IDLE);
  const cacheRef = useRef<Map<string, CachedResult>>(new Map());

  const validRange =
    Boolean(checkInDate) &&
    Boolean(checkOutDate) &&
    isCheckOutAfterCheckIn(checkInDate as string, checkOutDate as string);
  const key =
    enabled && roomId && validRange && guests >= 1
      ? `${roomId}|${checkInDate}|${checkOutDate}|${guests}`
      : null;

  useEffect(() => {
    if (!key) {
      setState(IDLE);
      return;
    }

    const cached = cacheRef.current.get(key);
    if (cached) {
      setState({ isChecking: false, ...cached });
      return;
    }

    // Reset to "unknown" (not a stale false) so the form is usable while we check.
    setState({
      isChecking: true,
      isAvailable: null,
      guestsWithinCapacity: null,
      reason: null,
    });

    let cancelled = false;
    const timer = setTimeout(() => {
      checkRoomAvailability({
        roomId: roomId as string,
        checkInDate: checkInDate as string,
        checkOutDate: checkOutDate as string,
        guests,
      })
        .then((result) => {
          if (cancelled) return;
          const guestsWithinCapacity = result.guestsWithinCapacity !== false;
          const isAvailable = result.available !== false;
          const entry: CachedResult = {
            isAvailable,
            guestsWithinCapacity,
            reason: resultReason(isAvailable, guestsWithinCapacity),
          };
          cacheRef.current.set(key, entry);
          setState({ isChecking: false, ...entry });
        })
        .catch(() => {
          if (cancelled) return;
          // Network failure → don't block the guest; POST /bookings is the
          // authoritative gate and rejects a genuinely taken date.
          setState(IDLE);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, roomId, checkInDate, checkOutDate, guests]);

  return state;
};
