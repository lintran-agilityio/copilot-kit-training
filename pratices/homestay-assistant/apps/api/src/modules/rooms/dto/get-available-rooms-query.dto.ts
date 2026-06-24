export class GetAvailableRoomsQueryDto {
  /**
   * Target date for availability (YYYY-MM-DD).
   * Defaults to today when omitted, null, or empty.
   */
  date?: string;
}
