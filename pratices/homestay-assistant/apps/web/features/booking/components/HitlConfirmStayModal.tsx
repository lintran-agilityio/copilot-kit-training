"use client";

import type { ReactNode } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";
import {
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";

import { ConfirmBookingDialog } from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chat/components";
import { HitlDecisionUserMessage } from "@/features/booking/components/HitlDecisionUserMessage";
import { useHitlConfirmDialog } from "@/features/booking/hooks";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";
import { useReportHomestayAgentWorkflow } from "@/features/chat/hooks/use-report-homestay-agent-workflow";
import { shouldRenderHitlCard } from "@/features/booking/utils";
import type {
  ConfirmBookingArgs,
  ConfirmBookingResult,
} from "@/features/booking/schemas";
import type {
  ConfirmModifyBookingArgs,
  ConfirmModifyBookingResult,
} from "@/features/booking/schemas";

const hasRoomStayFields = (
  args: Partial<{
    room?: {
      id?: string;
      name?: string;
      pricePerNight?: number;
    };
    checkInDate?: string;
    checkOutDate?: string;
    guests?: number;
  }>,
) =>
  Boolean(
    args.room?.id?.trim() &&
      args.room?.name?.trim() &&
      typeof args.room?.pricePerNight === "number" &&
      args.checkInDate?.trim() &&
      args.checkOutDate?.trim() &&
      typeof args.guests === "number" &&
      args.guests > 0,
  );

const hasRequiredCreateArgs = (
  args: Partial<ConfirmBookingArgs>,
): args is ConfirmBookingArgs => hasRoomStayFields(args);

const hasRequiredModifyArgs = (
  args: Partial<ConfirmModifyBookingArgs>,
): args is ConfirmModifyBookingArgs =>
  Boolean(args.bookingId?.trim()) && hasRoomStayFields(args);

type HitlConfirmStayModalProps = {
  status: ToolCallStatus;
  result?: unknown;
} & (
  | {
      variant: "create";
      args: Partial<ConfirmBookingArgs>;
      respond?: (result: ConfirmBookingResult) => Promise<void>;
    }
  | {
      variant: "modify";
      args: Partial<ConfirmModifyBookingArgs>;
      respond?: (result: ConfirmModifyBookingResult) => Promise<void>;
    }
);

const HitlConfirmCreateStayModal = ({
  status,
  args,
  respond,
  result,
}: {
  status: ToolCallStatus;
  args: Partial<ConfirmBookingArgs>;
  respond?: (result: ConfirmBookingResult) => Promise<void>;
  result?: unknown;
}) => {
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const finalizeBookingForms = useArtifactStore(
    (state) => state.finalizeBookingForms,
  );
  const {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    decisionStatus,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    "Failed to confirm booking",
    result,
  );

  const handleCancel = () => {
    finalizeBookingForms("cancelled");
    resetBooking();
    handleDismiss();
  };

  const hasArgs = hasRequiredCreateArgs(args);
  useReportHomestayAgentWorkflow(
    shouldRender && hasArgs && canRespond,
    "confirm-booking",
    {
      type: HOMESTAY_AGENT_TASK_TYPE.BOOK,
      status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
    },
    hasArgs ? { type: "room", id: args.room.id } : undefined,
  );

  if (!shouldRenderHitlCard(status, hasArgs) || !shouldRender || !hasArgs) {
    return null;
  }

  const { room, checkInDate, checkOutDate, guests } = args;

  return (
    <>
      <EmbeddedWidget>
        <ConfirmBookingDialog
          roomName={room.name}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          guests={guests}
          pricePerNight={room.pricePerNight}
          isSubmitting={isSubmitting}
          canRespond={canRespond}
          decisionStatus={decisionStatus}
          errorMessage={errorMessage}
          onCancel={handleCancel}
          onConfirm={() =>
            void confirm({
              confirmed: true,
              roomId: room.id,
              checkInDate,
              checkOutDate,
              guests,
            })
          }
        />
      </EmbeddedWidget>
      <HitlDecisionUserMessage
        decisionStatus={decisionStatus}
        confirmLabel="Confirm booking"
        cancelLabel="Cancel booking"
      />
    </>
  );
};

const HitlConfirmModifyStayModal = ({
  status,
  args,
  respond,
  result,
}: {
  status: ToolCallStatus;
  args: Partial<ConfirmModifyBookingArgs>;
  respond?: (result: ConfirmModifyBookingResult) => Promise<void>;
  result?: unknown;
}) => {
  const pendingModifyStay = useBookingStore((state) => state.pendingModifyStay);
  const setPendingModifyStay = useBookingStore(
    (state) => state.setPendingModifyStay,
  );
  const {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    decisionStatus,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    "Failed to confirm booking changes",
    result,
  );

  const hasArgs = hasRequiredModifyArgs(args);
  useReportHomestayAgentWorkflow(
    shouldRender && hasArgs && canRespond,
    "confirm-modify-booking",
    {
      type: HOMESTAY_AGENT_TASK_TYPE.MANAGE,
      status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
    },
    hasArgs ? { type: "booking", id: args.bookingId } : undefined,
  );

  if (!shouldRenderHitlCard(status, hasArgs) || !shouldRender || !hasArgs) {
    return null;
  }

  const { bookingId, room } = args;
  // Prefer dates/guests the guest chose in edit_modify_booking over tool args
  // the model may fill with stale working-memory or pre-edit values.
  const stayFromEdit =
    pendingModifyStay?.bookingId === bookingId ? pendingModifyStay : null;
  const checkInDate = stayFromEdit?.checkInDate ?? args.checkInDate;
  const checkOutDate = stayFromEdit?.checkOutDate ?? args.checkOutDate;
  const guests = stayFromEdit?.guests ?? args.guests;
  const description: ReactNode = (
    <>
      Review the updated details for your stay at{" "}
      <span className="font-medium text-zinc-200">{room.name}</span> before
      saving.
    </>
  );

  const clearPendingAndDismiss = () => {
    setPendingModifyStay(null);
    handleDismiss();
  };

  return (
    <>
      <EmbeddedWidget>
        <ConfirmBookingDialog
          roomName={room.name}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          guests={guests}
          pricePerNight={room.pricePerNight}
          title="Confirm booking changes?"
          description={description}
          confirmLabel="Confirm changes"
          submittingLabel="Updating…"
          isSubmitting={isSubmitting}
          canRespond={canRespond}
          decisionStatus={decisionStatus}
          errorMessage={errorMessage}
          onCancel={clearPendingAndDismiss}
          onConfirm={() =>
            void confirm({
              confirmed: true,
              bookingId,
              checkInDate,
              checkOutDate,
              guests,
            })
          }
        />
      </EmbeddedWidget>
      <HitlDecisionUserMessage
        decisionStatus={decisionStatus}
        confirmLabel="Confirm changes"
        cancelLabel="Cancel changes"
      />
    </>
  );
};

export const HitlConfirmStayModal = (props: HitlConfirmStayModalProps) => {
  if (props.variant === "create") {
    return (
      <HitlConfirmCreateStayModal
        status={props.status}
        args={props.args}
        respond={props.respond}
        result={props.result}
      />
    );
  }

  return (
    <HitlConfirmModifyStayModal
      status={props.status}
      args={props.args}
      respond={props.respond}
      result={props.result}
    />
  );
};
