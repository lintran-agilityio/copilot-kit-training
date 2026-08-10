import { create } from "zustand";

import {
  BOOKING_MUTATION_PHASE,
  type BookingMutationPhase,
} from "@/features/booking/constants";

export type ModifyBookingCardOutcome = {
  correlationKey: string;
  phase: BookingMutationPhase;
  bookingId?: string;
  errorMessage?: string;
};

type ModifyBookingCardStore = {
  outcomesByCorrelationKey: Record<string, ModifyBookingCardOutcome>;
  /** Correlation key of the most recently confirmed modify HITL awaiting update_booking. */
  latestPendingCorrelationKey: string | null;
  markSubmitting: (correlationKey: string) => void;
  markSuccess: (correlationKey: string, data: { bookingId: string }) => void;
  markFailed: (correlationKey: string, errorMessage: string) => void;
  /**
   * Resolve which outcome slot to update for an update_booking result.
   * Preferred: exact correlation key. Fallback: latest pending modify card.
   */
  resolveTargetCorrelationKey: (
    correlationKey: string | null,
  ) => string | null;
  getOutcome: (
    correlationKey: string | null,
  ) => ModifyBookingCardOutcome | null;
};

export const useModifyBookingCardStore = create<ModifyBookingCardStore>()(
  (set, get) => ({
    outcomesByCorrelationKey: {},
    latestPendingCorrelationKey: null,

    markSubmitting: (correlationKey) =>
      set((state) => ({
        latestPendingCorrelationKey: correlationKey,
        outcomesByCorrelationKey: {
          ...state.outcomesByCorrelationKey,
          [correlationKey]: {
            correlationKey,
            phase: BOOKING_MUTATION_PHASE.SUBMITTING,
          },
        },
      })),

    markSuccess: (correlationKey, data) =>
      set((state) => ({
        latestPendingCorrelationKey:
          state.latestPendingCorrelationKey === correlationKey
            ? null
            : state.latestPendingCorrelationKey,
        outcomesByCorrelationKey: {
          ...state.outcomesByCorrelationKey,
          [correlationKey]: {
            correlationKey,
            phase: BOOKING_MUTATION_PHASE.SUCCESS,
            bookingId: data.bookingId,
          },
        },
      })),

    markFailed: (correlationKey, errorMessage) =>
      set((state) => ({
        latestPendingCorrelationKey:
          state.latestPendingCorrelationKey === correlationKey
            ? null
            : state.latestPendingCorrelationKey,
        outcomesByCorrelationKey: {
          ...state.outcomesByCorrelationKey,
          [correlationKey]: {
            correlationKey,
            phase: BOOKING_MUTATION_PHASE.FAILED,
            errorMessage,
          },
        },
      })),

    resolveTargetCorrelationKey: (correlationKey) => {
      const { outcomesByCorrelationKey, latestPendingCorrelationKey } = get();

      if (correlationKey && outcomesByCorrelationKey[correlationKey]) {
        return correlationKey;
      }

      if (
        latestPendingCorrelationKey &&
        outcomesByCorrelationKey[latestPendingCorrelationKey]
      ) {
        return latestPendingCorrelationKey;
      }

      return correlationKey ?? latestPendingCorrelationKey;
    },

    getOutcome: (correlationKey) => {
      if (!correlationKey) {
        return null;
      }

      return get().outcomesByCorrelationKey[correlationKey] ?? null;
    },
  }),
);
