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
import { MODEL_NAME } from "@repo/types";
import type {
  ConfirmBookingArgs,
  ConfirmBookingResult,
  ConfirmModifyBookingArgs,
  ConfirmModifyBookingResult,
} from "@repo/schemas";

import {
  ConfirmCreateHitlCard,
  ConfirmModifyHitlCard,
} from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chatbot/components";
import {
  BOOKINGS_PAGE_PATH,
  CONFIRM_BOOKING,
  HITL_CARD_PHASE,
} from "@/features/booking/constants";
import {
  useConfirmBookingRoom,
  useHitlConfirmDialog,
  useModifyBookingResolution,
  useRetryCreateBooking,
  useRetryModifyBooking,
} from "@/features/booking/hooks";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useCreateBookingCardStore } from "@/features/booking/stores/create-booking-card-store";
import { useModifyBookingCardStore } from "@/features/booking/stores/modify-booking-card-store";
import { useArtifactStore } from "@/features/chatbot/stores/artifact-store";
import { useReportHomestayAgentUiFocus } from "@/features/chatbot/hooks";
import {
  buildCreateStayCorrelationKey,
  buildModifyChangeRows,
  buildModifyStayCorrelationKey,
  coalesceBookingCardOutcome,
  deriveCreateBookingOutcomeFromMessages,
  deriveModifyBookingOutcomeFromMessages,
  hasRequiredCreateArgs,
  hasRoomStayFields,
  resolveHitlCardPhase,
  resolveOriginalStay,
  shouldRenderHitlCard,
} from "@/features/booking/utils";
import type { HitlToolResult } from "@/features/booking/types";

type HitlConfirmStayModalProps =
  | {
      variant: MODEL_NAME.CREATE;
      status: ToolCallStatus;
      args: Partial<ConfirmBookingArgs>;
      respond?: (result: ConfirmBookingResult) => Promise<void>;
      result?: HitlToolResult<ConfirmBookingResult>;
      toolCallId?: string;
    }
  | {
      variant: MODEL_NAME.MODIFY;
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
  const {
    title: CREATE_TITLE,
    label: CREATE_LABEL,
    error: CREATE_ERROR,
  } = CONFIRM_BOOKING.CREATE;

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
  } = useHitlConfirmDialog(status, respond, CREATE_ERROR.confirm, result, toolCallId);

  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  // A transport may keep isRunning true while HITL awaits respond(). Keep the
  // current prompt usable, then lock it as soon as respond() is consumed.
  const isAgentBusy = agent.isRunning && !canRespond;
  const hasArgs = hasRequiredCreateArgs(args);
  // confirm_booking args carry only roomId — hydrate the room (Booking Form
  // stash, or the find_room/get_room_by_id result in the transcript).
  const room = useConfirmBookingRoom(hasArgs ? args.roomId : undefined);
  const canRenderCard =
    hasArgs && room != null && typeof room.pricePerNight === "number";
  const correlationKey = hasArgs
    ? buildCreateStayCorrelationKey({
        roomId: args.roomId,
        checkInDate: args.checkInDate,
        checkOutDate: args.checkOutDate,
        guests: args.guests,
      })
    : null;
  const storeCreateOutcome = useCreateBookingCardStore((state) =>
    correlationKey
      ? (state.outcomesByCorrelationKey[correlationKey] ?? null)
      : null,
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
    if (isAgentBusy) {
      return;
    }

    finalizeBookingForms("cancelled");
    resetBooking();
    handleDismiss();
  };

  const handleConfirm = () => {
    if (isAgentBusy || !hasArgs || !correlationKey) {
      return;
    }

    markSubmitting(correlationKey);
    void confirm({
      confirmed: true,
      roomId: args.roomId,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      guests: args.guests,
    });
  };

  const handleRetry = () => {
    if (isAgentBusy || !correlationKey || isRetrying || !isActionable) {
      return;
    }

    markSubmitting(correlationKey);
    retryCreateBooking();
  };

  const handleViewBookings = () => {
    if (isAgentBusy) {
      return;
    }

    router.push(BOOKINGS_PAGE_PATH);
  };

  useReportHomestayAgentUiFocus(
    shouldRender && canRenderCard && canRespond,
    "confirm-booking",
    {
      type: HOMESTAY_AGENT_TASK_TYPE.BOOK,
      status: HOMESTAY_AGENT_TASK_STATUS.AWAITING_CONFIRMATION,
    },
    hasArgs ? { type: "room", id: args.roomId } : undefined,
  );

  if (
    !shouldRenderHitlCard(status, canRenderCard) ||
    !shouldRender ||
    !hasArgs ||
    room == null ||
    typeof room.pricePerNight !== "number"
  ) {
    return null;
  }

  const { checkInDate, checkOutDate, guests } = args;

  return (
    <EmbeddedWidget>
      <ConfirmCreateHitlCard
        roomName={room.name}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        guests={guests}
        pricePerNight={room.pricePerNight}
        title={CREATE_TITLE.review}
        confirmLabel={CREATE_LABEL.confirm}
        submittingLabel={CREATE_LABEL.submitting}
        isSubmitting={
          isSubmitting || createPhase === HITL_CARD_PHASE.SUBMITTING
        }
        canRespond={canRespond}
        decisionStatus={decisionStatus}
        createPhase={createPhase}
        failureReason={createOutcome?.errorMessage}
        totalPriceOverride={
          createPhase === HITL_CARD_PHASE.SUCCESS
            ? createOutcome?.totalPrice
            : undefined
        }
        errorMessage={errorMessage}
        allActionsDisabled={isAgentBusy}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        onViewBookings={handleViewBookings}
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
  const {
    title: MODIFY_TITLE,
    label: MODIFY_LABEL,
    error: MODIFY_ERROR,
  } = CONFIRM_BOOKING.MODIFY;
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
    MODIFY_ERROR.confirm,
    result,
    toolCallId,
  );
  // Executing is the active user-decision phase, so its open run must not
  // disable the controls needed to resolve that run.
  const isAgentBusy = agent.isRunning && !canRespond;

  // Stated-change path: the merged/proposed stay, room, and originals are
  // authoritative on the find_booking_by_id result — NOT on the model-authored
  // confirm_modify_booking args (a weak model routinely copies the booking's
  // original check-out into `checkOutDate`, collapsing the before → after diff
  // so this card hides itself as a no-op). The edit-form path has no such
  // result (no `availability` block) and keeps using pendingModifyStay.
  const resolution = useModifyBookingResolution(args.bookingId);

  const bookingId = (args.bookingId ?? resolution?.bookingId ?? "").trim();
  const room = resolution?.room ?? args.room;

  // The edit-form path is fully described by pendingModifyStay (proposed +
  // original). Only fall back to the find_booking_by_id resolution on the
  // stated-change path — an earlier stated-change result left in the transcript
  // must not leak into a later form-path modify of the same booking.
  const stayFromEdit =
    pendingModifyStay?.bookingId != null &&
    pendingModifyStay.bookingId === bookingId
      ? pendingModifyStay
      : null;
  const resolvedStay = stayFromEdit ? null : resolution;

  // Prefer dates/guests the guest chose in edit_modify_booking, then the
  // find_booking_by_id merged stay, and only then the model's args.
  const checkInDate =
    stayFromEdit?.checkInDate ??
    resolvedStay?.proposed.checkInDate ??
    args.checkInDate ??
    "";
  const checkOutDate =
    stayFromEdit?.checkOutDate ??
    resolvedStay?.proposed.checkOutDate ??
    args.checkOutDate ??
    "";
  const guests =
    stayFromEdit?.guests ??
    resolvedStay?.proposed.guests ??
    (typeof args.guests === "number" ? args.guests : 0);

  const hasArgs =
    Boolean(bookingId) &&
    hasRoomStayFields({ room, checkInDate, checkOutDate, guests });

  const correlationKey = hasArgs
    ? buildModifyStayCorrelationKey({
        bookingId,
        checkInDate,
        checkOutDate,
        guests,
      })
    : null;
  const storeModifyOutcome = useModifyBookingCardStore((state) =>
    correlationKey
      ? (state.outcomesByCorrelationKey[correlationKey] ?? null)
      : null,
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

  // Stated-change path: resolvedStay.original (the booking's real current stay,
  // from find_booking_by_id.bookings[0]) is authoritative over any original*
  // the model may have mis-filled. The edit-form path has no resolvedStay, so
  // resolveOriginalStay falls through to pendingModifyStay.original.
  const original = hasArgs
    ? (resolvedStay?.original ??
      resolveOriginalStay(pendingModifyStay, bookingId, args) ??
      null)
    : null;
  const hasNoFieldChanges =
    Boolean(original) &&
    hasArgs &&
    buildModifyChangeRows(
      original!,
      { checkInDate, checkOutDate, guests },
      room?.pricePerNight ?? 0,
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
    hasArgs ? { type: "booking", id: bookingId } : undefined,
  );

  if (
    !shouldRenderHitlCard(status, hasArgs) ||
    !shouldRender ||
    !hasArgs ||
    !room ||
    typeof room.pricePerNight !== "number" ||
    hasNoFieldChanges
  ) {
    return null;
  }

  const description: ReactNode = (
    <>
      Review the changes for your stay at{" "}
      <span className="font-medium text-foreground">{room.name}</span> before
      saving.
    </>
  );

  const clearPendingAndDismiss = () => {
    if (isAgentBusy) {
      return;
    }

    setPendingModifyStay(null);
    handleDismiss();
  };

  const handleConfirm = () => {
    if (isAgentBusy || !correlationKey) {
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
    if (isAgentBusy || !correlationKey || isRetrying || !isActionable) {
      return;
    }

    markSubmitting(correlationKey);
    retryModifyBooking();
  };

  const isPhaseSubmitting =
    isSubmitting || modifyPhase === HITL_CARD_PHASE.SUBMITTING;
  const viewBookings = () => {
    if (isAgentBusy) {
      return;
    }

    router.push(BOOKINGS_PAGE_PATH);
  };
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
          title={MODIFY_TITLE.review}
          description={description}
          confirmLabel={MODIFY_LABEL.confirm}
          submittingLabel={MODIFY_LABEL.submitting}
          isSubmitting={isPhaseSubmitting}
          canRespond={canRespond}
          decisionStatus={decisionStatus}
          modifyPhase={modifyPhase}
          failureReason={modifyOutcome?.errorMessage}
          errorMessage={errorMessage}
          allActionsDisabled={isAgentBusy}
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
        allActionsDisabled={isAgentBusy}
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
  if (props.variant === MODEL_NAME.CREATE) {
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
