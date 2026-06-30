export class GetRoomByIdQueryDto {
  /**
   * When provided, returns the user's active booking status for this room.
   */
  userId?: string;

  /**
   * Check-in date (YYYY-MM-DD) used with checkOutDate to compute availability.
   */
  checkInDate?: string;

  /**
   * Check-out date (YYYY-MM-DD) used with checkInDate to compute availability.
   */
  checkOutDate?: string;
}
