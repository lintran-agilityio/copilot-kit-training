/** Copy for create-flow confirm HITL card. */
export const CONFIRM_BOOKING = {
  title: {
    review: "Please confirm your booking",
    submitting: "Creating booking…",
    success: "Booking confirmed",
    failed: "Booking failed",
    approved: "Confirmed by you",
    rejected: "Cancelled by you",
    expired: "Confirmation expired",
  },
  label: {
    confirm: "Confirm",
    cancel: "Cancel",
    submitting: "Creating booking…",
    viewBookings: "View bookings",
    retry: "Retry",
  },
  error: {
    confirm: "Failed to confirm booking",
  },
} as const;

/** Copy for modify-flow confirm HITL card (and create-dialog fallback). */
export const CONFIRM_MODIFY_BOOKING = {
  title: {
    review: "Modify booking",
    altPending: "Confirm booking changes?",
    submitting: "Updating booking…",
    success: "Booking updated",
    failed: "Update failed",
    approved: "Changes confirmed by you",
    rejected: "Changes cancelled by you",
    expired: "Change confirmation expired",
  },
  label: {
    confirm: "Confirm Changes",
    cancel: "Cancel",
    submitting: "Updating…",
    viewBookings: "View bookings",
    retry: "Retry",
  },
  error: {
    confirm: "Failed to confirm booking changes",
  },
} as const;

/** Copy for cancel-flow confirm HITL card. */
export const CONFIRM_CANCEL_BOOKING = {
  title: {
    review: "Cancel this booking?",
    submitting: "Cancelling booking…",
    success: "Booking cancelled",
    failed: "Cancellation failed",
    rejected: "Kept by you",
    expired: "Confirmation expired",
  },
  label: {
    confirm: "Cancel booking",
    keep: "Keep booking",
    submitting: "Cancelling…",
    viewBookings: "View bookings",
    retry: "Retry",
  },
  error: {
    confirm: "Failed to cancel booking",
  },
} as const;

/** Shape shared by every multi-booking disambiguation picker's copy. */
export type BookingPickerCopy = {
  title: string;
  description: (queryName: string) => string;
  keepLabel: string;
  completed: {
    rejectedTitle: string;
    approvedTitle: string;
    /** Title shown when the picker settles without a clear approve/reject (supersede or missing decision). */
    expiredTitle: string;
    keptAll: (queryName: string) => string;
    multiMatch: (queryName: string) => string;
    expiredBody: (queryName: string) => string;
  };
};

/** Copy for cancel multi-booking disambiguation picker (HITL list). */
export const CANCEL_BOOKING_PICKER = {
  title: "Which booking should be cancelled?",
  description: (queryName: string) =>
    `Multiple bookings match “${queryName}”. Select one to cancel.`,
  keepLabel: "Keep bookings",
  completed: {
    rejectedTitle: "Cancelled by you",
    approvedTitle: "Confirmed by you",
    expiredTitle: CONFIRM_CANCEL_BOOKING.title.expired,
    keptAll: (queryName: string) =>
      `You kept all bookings matching “${queryName}”.`,
    multiMatch: (queryName: string) =>
      `Multiple bookings match “${queryName}”.`,
    expiredBody: (queryName: string) =>
      `This cancellation confirmation for “${queryName}” is no longer available.`,
  },
} satisfies BookingPickerCopy;

/** Copy for modify multi-booking disambiguation picker (HITL list). */
export const MODIFY_BOOKING_PICKER = {
  title: "Which booking should be modified?",
  description: (queryName: string) =>
    `Multiple bookings match “${queryName}”. Select one to modify.`,
  keepLabel: "Keep bookings unchanged",
  completed: {
    rejectedTitle: "Kept unchanged",
    approvedTitle: "Selected by you",
    expiredTitle: "Kept unchanged",
    keptAll: (queryName: string) =>
      `You kept all bookings matching “${queryName}” unchanged.`,
    multiMatch: (queryName: string) =>
      `Multiple bookings match “${queryName}”.`,
    expiredBody: (queryName: string) =>
      `This modify selection for “${queryName}” is no longer available.`,
  },
} satisfies BookingPickerCopy;

/** Titles that mark ConfirmCreateHitlCard as the modify fallback layout. */
export const MODIFY_PENDING_TITLES = new Set<string>([
  CONFIRM_MODIFY_BOOKING.title.altPending,
  CONFIRM_MODIFY_BOOKING.title.review,
]);
