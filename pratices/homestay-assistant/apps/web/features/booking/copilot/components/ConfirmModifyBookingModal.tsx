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
  ConfirmModifyBookingArgs,
  ConfirmModifyBookingResult,
} from "@/features/booking/schemas";

type ConfirmModifyBookingModalProps = {
  status: ToolCallStatus;
  args: Partial<ConfirmModifyBookingArgs>;
  respond?: (result: ConfirmModifyBookingResult) => Promise<void>;
};

const hasRequiredArgs = (args: Partial<ConfirmModifyBookingArgs>) =>
  Boolean(
    args.bookingId?.trim() &&
      args.room?.id?.trim() &&
      args.room?.name?.trim() &&
      typeof args.room?.pricePerNight === "number" &&
      args.checkInDate?.trim() &&
      args.checkOutDate?.trim() &&
      typeof args.guests === "number" &&
      args.guests > 0,
  );

export const ConfirmModifyBookingModal = ({
  status,
  args,
  respond,
}: ConfirmModifyBookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { respondOnce, canRespond } =
    useHitlRespondOnce<ConfirmModifyBookingResult>(respond);

  if (isHitlToolFinished(status) || !isHitlToolAwaitingUser(status)) {
    return null;
  }

  if (!hasRequiredArgs(args)) {
    return null;
  }

  const { bookingId, room, checkInDate, checkOutDate, guests } =
    args as ConfirmModifyBookingArgs;

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
        bookingId,
        checkInDate,
        checkOutDate,
        guests,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to confirm booking changes",
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
      title="Confirm booking changes?"
      description={
        <>
          Review the updated details for your stay at{" "}
          <span className="font-medium text-zinc-200">{room.name}</span> before
          saving.
        </>
      }
      confirmLabel="Confirm changes"
      submittingLabel="Updating…"
      isSubmitting={isSubmitting}
      canRespond={canRespond}
      errorMessage={errorMessage}
      onCancel={handleCancel}
      onConfirm={() => void handleConfirm()}
    />
  );
};
