"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgent, ToolCallStatus } from "@copilotkit/react-core/v2";
import {
  AGENT_KEYS,
  HOMESTAY_AGENT_TASK_STATUS,
  HOMESTAY_AGENT_TASK_TYPE,
} from "@repo/constants";

import {
  ConfirmCreateHitlCard,
  ConfirmModifyHitlCard,
} from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chat/components";
import {
  BOOKINGS_PAGE_PATH,
  CONFIRM_BOOKING,
  CONFIRM_MODIFY_BOOKING,
  HITL_CARD_PHASE,
} from "@/features/booking/constants";
import {
  useHitlConfirmDialog,
  useRetryCreateBooking,
  useRetryModifyBooking,
} from "@/features/booking/hooks";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useCreateBookingCardStore } from "@/features/booking/stores/create-booking-card-store";
import { useModifyBookingCardStore } from "@/features/booking/stores/modify-booking-card-store";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";
import { useReportHomestayAgentUiFocus } from "@/features/chat/hooks/use-report-homestay-agent-ui-focus";
import {
  buildCreateStayCorrelationKey,
  buildModifyChangeRows,
  buildModifyStayCorrelationKey,
  coalesceBookingCardOutcome,
  deriveCreateBookingOutcomeFromMessages,
  deriveModifyBookingOutcomeFromMessages,
  hasRequiredCreateArgs,
  hasRequiredModifyArgs,
  resolveHitlCardPhase,
  resolveOriginalStay,
  shouldRenderHitlCard,
} from "@/features/booking/utils";
import type {
  ConfirmBookingArgs,
  ConfirmBookingResult,
  ConfirmModifyBookingArgs,
  ConfirmModifyBookingResult,
} from "@repo/schemas";
import type { HitlToolResult } from "@/features/booking/types";

type HitlConfirmStayModalProps =
  | {
      variant: "create";
      status: ToolCallStatus;
      args: Partial<ConfirmBookingArgs>;
      respond?: (result: ConfirmBookingResult) => Promise<void>;
      result?: HitlToolResult<ConfirmBookingResult>;
      toolCallId?: string;
    }
  | {
      variant: "modify";
      status: ToolCallStatus;
      args: Partial<ConfirmModifyBookingArgs>;
      respond?: (result: ConfirmModifyBookingResult) => Promise<void>;
      result?: HitlToolResult<ConfirmModifyBookingResult>;
      toolCallId?: string;
    };

const HitlConfirmCreateStayModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: {
  status: ToolCallStatus;
  args: Partial<ConfirmBookingArgs>;
  respond?: (result: ConfirmBookingResult) => Promise<void>;
  result?: HitlToolResult<ConfirmBookingResult>;
  toolCallId?: string;
}) => {
  const router = useRouter();
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const finalizeBookingForms = useArtifactStore(
    (state) => state.finalizeBookingForms,
  );
  const markSubmitting = useCreateBookingCardStore(
    (state) => state.markSubmitting,
  );
  const { retryCreateBooking, isRetrying } = useRetryCreateBooking();
  const {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    isActionable,
    expiredBySupersede,
    decisionStatus,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    CONFIRM_BOOKING.error.confirm,
    result,
    toolCallId,
  );

  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const hasArgs = hasRequiredCreateArgs(args);
  const correlationKey = hasArgs
    ? buildCreateStayCorrelationKey({
        roomId: args.room.id,
        checkInDate: args.checkInDate,
        checkOutDate: args.checkOutDate,
        guests: args.guests,
      })
    : null;
  const storeCreateOutcome = useCreateBookingCardStore((state) =>
    correlationKey ? (state.outcomesByCorrelationKey[correlationKey] ?? null) : null,
  );
  const createOutcome = coalesceBookingCardOutcome(
    storeCreateOutcome,
    deriveCreateBookingOutcomeFromMessages(agent.messages, correlationKey),
  );
  const createPhase = expiredBySupersede
    ? HITL_CARD_PHASE.EXPIRED
    : resolveHitlCardPhase({
        status: decisionStatus,
        isHitlSubmitting: isSubmitting,
        outcome: createOutcome,
      });

  const handleCancel = () => {
    finalizeBookingForms("cancelled");
    resetBooking();
    handleDismiss();
  };

  const handleConfirm = () => {
    if (!hasArgs || !correlationKey) {
      return;
    }

    markSubmitting(correlationKey);
    void confirm({
      confirmed: true,
      roomId: args.room.id,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      guests: args.guests,
    });
  };

  const handleRetry = () => {
    if (!correlationKey || isRetrying || !isActionable) {
      return;
    }

    markSubmitting(correlationKey);
    retryCreateBooking();
  };

  useReportHomestayAgentUiFocus(
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
    <EmbeddedWidget>
      <ConfirmCreateHitlCard
        roomName={room.name}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        guests={guests}
        pricePerNight={room.pricePerNight}
        title={CONFIRM_BOOKING.title.review}
        confirmLabel={CONFIRM_BOOKING.label.confirm}
        submittingLabel={CONFIRM_BOOKING.label.submitting}
        isSubmitting={
          isSubmitting || createPhase === HITL_CARD_PHASE.SUBMITTING
        }
        canRespond={canRespond}
        decisionStatus={decisionStatus}
        createPhase={createPhase}
        failureReason={createOutcome?.errorMessage}
        totalPriceOverride={createOutcome?.totalPrice}
        errorMessage={errorMessage}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        onViewBookings={() => router.push(BOOKINGS_PAGE_PATH)}
        onRetry={handleRetry}
        viewBookingsDisabled={!isActionable}
        retryDisabled={!isActionable}
      />
    </EmbeddedWidget>
  );
};

const HitlConfirmModifyStayModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: {
  status: ToolCallStatus;
  args: Partial<ConfirmModifyBookingArgs>;
  respond?: (result: ConfirmModifyBookingResult) => Promise<void>;
  result?: HitlToolResult<ConfirmModifyBookingResult>;
  toolCallId?: string;
}) => {
  const router = useRouter();
  const pendingModifyStay = useBookingStore((state) => state.pendingModifyStay);
  const setPendingModifyStay = useBookingStore(
    (state) => state.setPendingModifyStay,
  );
  const markSubmitting = useModifyBookingCardStore(
    (state) => state.markSubmitting,
  );
  const { retryModifyBooking, isRetrying } = useRetryModifyBooking();
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    isActionable,
    expiredBySupersede,
    decisionStatus,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    CONFIRM_MODIFY_BOOKING.error.confirm,
    result,
    toolCallId,
  );

  const hasArgs = hasRequiredModifyArgs(args);
  // Prefer dates/guests the guest chose in edit_modify_booking over tool args
  // the model may fill with stale working-memory or pre-edit values.
  const stayFromEdit =
    hasArgs && pendingModifyStay?.bookingId === args.bookingId
      ? pendingModifyStay
      : null;
  const checkInDate = hasArgs
    ? (stayFromEdit?.checkInDate ?? args.checkInDate)
    : "";
  const checkOutDate = hasArgs
    ? (stayFromEdit?.checkOutDate ?? args.checkOutDate)
    : "";
  const guests = hasArgs ? (stayFromEdit?.guests ?? args.guests) : 0;
  const correlationKey =
    hasArgs
      ? buildModifyStayCorrelationKey({
          bookingId: args.bookingId,
          checkInDate,
          checkOutDate,
          guests,
        })
      : null;
  const storeModifyOutcome = useModifyBookingCardStore((state) =>
    correlationKey ? (state.outcomesByCorrelationKey[correlationKey] ?? null) : null,
  );
  const modifyOutcome = coalesceBookingCardOutcome(
    storeModifyOutcome,
    deriveModifyBookingOutcomeFromMessages(agent.messages, correlationKey),
  );
  const modifyPhase = expiredBySupersede
    ? HITL_CARD_PHASE.EXPIRED
    : resolveHitlCardPhase({
        status: decisionStatus,
        isHitlSubmitting: isSubmitting,
        outcome: modifyOutcome,
      });

  const original = hasArgs
    ? resolveOriginalStay(pendingModifyStay, args.bookingId, args)
    : null;
  const hasNoFieldChanges =
    Boolean(original) &&
    hasArgs &&
    buildModifyChangeRows(
      original!,
      { checkInDate, checkOutDate, guests },
      args.room.pricePerNight,
    ).length === 0;

  const dismissedNoopRef = useRef(false);
  useEffect(() => {
    if (!hasNoFieldChanges || !canRespond || dismissedNoopRef.current) {
      return;
    }
    dismissedNoopRef.current = true;
    setPendingModifyStay(null);
    handleDismiss();
  }, [hasNoFieldChanges, canRespond, handleDismiss, setPendingModifyStay]);

  useReportHomestayAgentUiFocus(
    shouldRender && hasArgs && canRespond && !hasNoFieldChanges,
    "confirm-modify-booking",
    {
      type: HOMESTAY_AGENT_TASK_TYPE.MANAGE,
      status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
    },
    hasArgs ? { type: "booking", id: args.bookingId } : undefined,
  );

  if (
    !shouldRenderHitlCard(status, hasArgs) ||
    !shouldRender ||
    !hasArgs ||
    hasNoFieldChanges
  ) {
    return null;
  }

  const { bookingId, room } = args;
  const description: ReactNode = (
    <>
      Review the changes for your stay at{" "}
      <span className="font-medium text-zinc-200">{room.name}</span> before
      saving.
    </>
  );

  const clearPendingAndDismiss = () => {
    setPendingModifyStay(null);
    handleDismiss();
  };

  const handleConfirm = () => {
    if (!correlationKey) {
      return;
    }

    markSubmitting(correlationKey);
    void confirm({
      confirmed: true,
      bookingId,
      checkInDate,
      checkOutDate,
      guests,
    });
  };

  const handleRetry = () => {
    if (!correlationKey || isRetrying || !isActionable) {
      return;
    }

    markSubmitting(correlationKey);
    retryModifyBooking();
  };

  const isPhaseSubmitting =
    isSubmitting || modifyPhase === HITL_CARD_PHASE.SUBMITTING;
  const viewBookings = () => router.push(BOOKINGS_PAGE_PATH);
  const retry = handleRetry;
  const isActionDisabled = !isActionable;

  // Without originals we cannot render before→after diffs — fall back to the
  // create-style summary of the proposed stay only.
  if (!original) {
    return (
      <EmbeddedWidget>
        <ConfirmCreateHitlCard
          roomName={room.name}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          guests={guests}
          pricePerNight={room.pricePerNight}
          title={CONFIRM_MODIFY_BOOKING.title.review}
          description={description}
          confirmLabel={CONFIRM_MODIFY_BOOKING.label.confirm}
          submittingLabel={CONFIRM_MODIFY_BOOKING.label.submitting}
          isSubmitting={isPhaseSubmitting}
          canRespond={canRespond}
          decisionStatus={decisionStatus}
          modifyPhase={modifyPhase}
          failureReason={modifyOutcome?.errorMessage}
          errorMessage={errorMessage}
          onCancel={clearPendingAndDismiss}
          onConfirm={handleConfirm}
          onViewBookings={viewBookings}
          onRetry={retry}
          viewBookingsDisabled={isActionDisabled}
          retryDisabled={isActionDisabled}
        />
      </EmbeddedWidget>
    );
  }

  return (
    <EmbeddedWidget>
      <ConfirmModifyHitlCard
        roomName={room.name}
        pricePerNight={room.pricePerNight}
        original={original}
        next={{ checkInDate, checkOutDate, guests }}
        description={description}
        isSubmitting={isPhaseSubmitting}
        canRespond={canRespond}
        decisionStatus={decisionStatus}
        modifyPhase={modifyPhase}
        failureReason={modifyOutcome?.errorMessage}
        errorMessage={errorMessage}
        onCancel={clearPendingAndDismiss}
        onConfirm={handleConfirm}
        onViewBookings={viewBookings}
        onRetry={retry}
        viewBookingsDisabled={isActionDisabled}
        retryDisabled={isActionDisabled}
      />
    </EmbeddedWidget>
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
        toolCallId={props.toolCallId}
      />
    );
  }

  return (
    <HitlConfirmModifyStayModal
      status={props.status}
      args={props.args}
      respond={props.respond}
      result={props.result}
      toolCallId={props.toolCallId}
    />
  );
};
