export type ModifyStayFields = {
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

/**
 * True when two stay snapshots share the same check-in, check-out, and guests.
 */
export const isSameModifyStay = (
  a: ModifyStayFields,
  b: ModifyStayFields,
): boolean =>
  a.checkInDate === b.checkInDate &&
  a.checkOutDate === b.checkOutDate &&
  a.guests === b.guests;
