import {
  addDays,
  isCheckOutAfterCheckIn,
  parseDateKey,
  toDateKey,
} from "@repo/utils";

export const resolveCheckOutAfterCheckInChange = (
  checkInDateKey: string,
  checkOutDate: string | null,
) => {
  const nextCheckOut =
    checkOutDate && isCheckOutAfterCheckIn(checkInDateKey, checkOutDate)
      ? checkOutDate
      : toDateKey(addDays(parseDateKey(checkInDateKey), 1));

  return {
    checkInDate: checkInDateKey,
    checkOutDate: nextCheckOut,
  };
};
