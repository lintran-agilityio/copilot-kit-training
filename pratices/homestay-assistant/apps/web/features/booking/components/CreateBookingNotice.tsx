"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ToolSuccessNotice } from "@/features/copilot/components/ToolSuccessNotice";
import { useBooking } from "@/features/booking/hooks";
import { CreateBookingToolProps } from "@/features/booking/types";
import { isCreateBookingSuccess } from "@/features/booking/utils";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { useRoomStore } from "@/features/room/stores/room-store";

export const CreateBookingNotice = (props: CreateBookingToolProps) => {
  const queryClient = useQueryClient();
  const resetBooking = useBooking((state) => state.resetBooking);
  const setBookingJustCompleted = useHomestayAgentUiStore(
    (state) => state.setBookingJustCompleted,
  );
  const finalizeBookingForms = useArtifactStore(
    (state) => state.finalizeBookingForms,
  );

  const onSuccess = useCallback(() => {
    finalizeBookingForms("success");
    resetBooking();
    setBookingJustCompleted(true);
    useRoomStore.getState().clearAgentRoomSearch();
    void queryClient.invalidateQueries({ queryKey: ["bookings"] });
  }, [
    finalizeBookingForms,
    queryClient,
    resetBooking,
    setBookingJustCompleted,
  ]);

  return (
    <ToolSuccessNotice
      {...props}
      title="Booking success"
      description="Your stay has been booked successfully."
      isSuccess={isCreateBookingSuccess}
      onSuccess={onSuccess}
    />
  );
};
