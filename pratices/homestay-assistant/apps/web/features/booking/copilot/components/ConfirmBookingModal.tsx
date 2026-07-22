"use client";

import { useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmBookingDialog } from "@/components/confirm-modal";
import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
  useHitlRespondOnce,
} from "@/features/booking/copilot/utils";
import type {
  ConfirmBookingArgs,
  ConfirmBookingResult,
} from "@/features/booking/schemas";

type ConfirmBookingModalProps = {
  status: ToolCallStatus;
  args: Partial<ConfirmBookingArgs>;
  respond?: (result: ConfirmBookingResult) => Promise<void>;
};

const hasRequiredArgs = (args: Partial<ConfirmBookingArgs>) =>
  Boolean(
    args.room?.id?.trim() &&
      args.room?.name?.trim() &&
      typeof args.room?.pricePerNight === "number" &&
      args.checkInDate?.trim() &&
      args.checkOutDate?.trim() &&
      typeof args.guests === "number" &&
      args.guests > 0,
  );

export const ConfirmBookingModal = ({
  status,
  args,
  respond,
}: ConfirmBookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { respondOnce, canRespond } =
    useHitlRespondOnce<ConfirmBookingResult>(respond);

  if (isHitlToolFinished(status) || !isHitlToolAwaitingUser(status)) {
    return null;
  }

  if (!hasRequiredArgs(args)) {
    return null;
  }

  const { room, checkInDate, checkOutDate, guests } = args as ConfirmBookingArgs;

  const handleCancel = () => {
    if (!canRespond) {
      return;
    }

    respondOnce({ confirmed: false });
  };

  const handleConfirm = async () => {
    if (!canRespond) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await respondOnce({
        confirmed: true,
        roomId: room.id,
        checkInDate,
        checkOutDate,
        guests,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to confirm booking",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmBookingDialog
      open
      roomName={room.name}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      guests={guests}
      pricePerNight={room.pricePerNight}
      isSubmitting={isSubmitting}
      canRespond={canRespond}
      errorMessage={errorMessage}
      onCancel={handleCancel}
      onConfirm={() => void handleConfirm()}
    />
  );
};
