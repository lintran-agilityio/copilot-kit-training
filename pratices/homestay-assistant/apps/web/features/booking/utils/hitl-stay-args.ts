import type {
  ConfirmBookingArgs,
  ConfirmModifyBookingArgs,
} from "@/features/booking/schemas";

type RoomStayFields = {
  room?: {
    id?: string;
    name?: string;
    pricePerNight?: number;
  };
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

/** True when room id/name/price and stay dates/guests are present and valid. */
export const hasRoomStayFields = (args: Partial<RoomStayFields>) =>
  Boolean(
    args.room?.id?.trim() &&
      args.room?.name?.trim() &&
      typeof args.room?.pricePerNight === "number" &&
      args.checkInDate?.trim() &&
      args.checkOutDate?.trim() &&
      typeof args.guests === "number" &&
      args.guests > 0,
  );

export const hasRequiredCreateArgs = (
  args: Partial<ConfirmBookingArgs>,
): args is ConfirmBookingArgs => hasRoomStayFields(args);

export const hasRequiredModifyArgs = (
  args: Partial<ConfirmModifyBookingArgs>,
): args is ConfirmModifyBookingArgs =>
  Boolean(args.bookingId?.trim()) && hasRoomStayFields(args);
