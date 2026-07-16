"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingSuccessDialog } from "@/components/confirm-modal";
import { useBooking } from "@/features/booking/hooks";
import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
} from "@/features/ai-elements/utils/hitl-tool-status";
import type {
  ShowBookingSuccessArgs,
  ShowBookingSuccessResult,
} from "@/features/booking/schemas";

type BookingSuccessModalProps = {
  status: ToolCallStatus;
  args: Partial<ShowBookingSuccessArgs>;
  respond?: (result: ShowBookingSuccessResult) => Promise<void>;
};

const parseShowBookingSuccessArgs = (args: Partial<ShowBookingSuccessArgs>) => {
  const checkInDate = args.checkInDate?.trim();
  const checkOutDate = args.checkOutDate?.trim();
  const guests = Number(args.guests);
  const totalPrice = Number(args.totalPrice);

  if (
    !checkInDate ||
    !checkOutDate ||
    !Number.isFinite(guests) ||
    guests <= 0 ||
    !Number.isFinite(totalPrice)
  ) {
    return null;
  }

  return { checkInDate, checkOutDate, guests, totalPrice };
};

export const BookingSuccessModal = ({
  status,
  args,
  respond,
}: BookingSuccessModalProps) => {
  const resetBooking = useBooking((state) => state.resetBooking);

  if (isHitlToolFinished(status) || !isHitlToolAwaitingUser(status)) {
    return null;
  }

  const parsedArgs = parseShowBookingSuccessArgs(args);

  if (!parsedArgs) {
    return null;
  }

  const canRespond = respond != null;
  const { checkInDate, checkOutDate, guests, totalPrice } = parsedArgs;

  const acknowledge = () => {
    resetBooking();

    if (!canRespond) {
      return;
    }

    void respond({ acknowledged: true });
  };

  return (
    <BookingSuccessDialog
      open
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      guests={guests}
      totalPrice={totalPrice}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          acknowledge();
        }
      }}
    />
  );
};
