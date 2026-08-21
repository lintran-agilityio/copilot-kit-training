import type { MastraDBMessage } from "@mastra/core/agent";
import {
  BARE_DAY_CUE,
  MONTH_DAY_CUE,
  NEXT_WEEKEND_CUE,
  LAST_WEEKEND_CUE,
  WEEKEND_CUE,
} from "@repo/constants";
import {
  extractMessageText,
  findLatestUserMessage,
} from "@/mastra/utils/latest-user-message";

/**
 * Deterministic "Booking Resolver" boundary: the BOOK step machine must never
 * trust `find_room(book_resolve)`'s echoed `date`/`guests` at face value as
 * "the guest stated this" — those fields are model-filled tool args, and an
 * eager model sometimes fills them with an invented default (guests: 1,
 * date: today) despite the prompt explicitly forbidding it (see
 * intent-playbook.ts's BOOK INTENT PRIORITY ❌ example). The model stays the
 * only place that classifies intent / extracts candidate values (prompt
 * layer); this module is the only place that decides whether those values
 * are actually grounded in the guest's own words (code layer) before the
 * step machine is allowed to skip the Booking Form.
 */

const TODAY_TONIGHT_TOMORROW_CUE = /\b(today|tonight|tomorrow)\b/i;

/** Vietnamese equivalents for hôm nay / tối nay / ngày mai / cuối tuần / thứ N / chủ nhật / "ngày N". */
const VI_DATE_CUE =
  /\b(hôm\s*nay|tối\s*nay|ngày\s*mai|cuối\s*tuần|th(ứ|u)\s*[2-7]|chủ\s*nhật|ngày\s*\d{1,2})\b/i;

const WEEKDAY_CUE =
  /\b(mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(day)?\b/i;

/**
 * Whether the guest's own latest message contains SOME recognizable check-in
 * date cue at all (word/phrase, not the resolved value — the model already
 * resolved that into `find_room.date`). Used only to corroborate that a
 * model-supplied book_resolve `date` has textual grounding, never to parse
 * the date itself.
 */
export const hasStatedCheckInCue = (text: string): boolean => {
  if (!text.trim()) return false;

  return (
    TODAY_TONIGHT_TOMORROW_CUE.test(text) ||
    VI_DATE_CUE.test(text) ||
    WEEKEND_CUE.test(text) ||
    NEXT_WEEKEND_CUE.test(text) ||
    LAST_WEEKEND_CUE.test(text) ||
    WEEKDAY_CUE.test(text) ||
    MONTH_DAY_CUE.test(text) ||
    BARE_DAY_CUE.test(text) ||
    /\d{4}-\d{2}-\d{2}/.test(text)
  );
};

/** "3 guests", "for 2 people", "2 khách", "3 người" — a party-size cue in the guest's own words. */
const GUEST_COUNT_CUE =
  /\d+\s*(?:guests?|people|persons?|pax|adults?|khách|người)\b/i;

/**
 * Whether the guest's own latest message states a party size at all. Used
 * only to corroborate a model-supplied book_resolve `guests`, never to parse
 * the count itself (the model already resolved that into `find_room.guests`).
 */
export const hasStatedGuestCue = (text: string): boolean =>
  GUEST_COUNT_CUE.test(text);

/**
 * Cross-checks the check-in date / guest count `find_room(book_resolve)`
 * echoed back against the guest's own latest message text. A value the
 * model attached without any corroborating cue in that text is treated as
 * unstated — so the BOOK step machine falls back to opening the Booking
 * Form instead of trusting an invented default.
 */
export const resolveCorroboratedBookFacts = (args: {
  messages: MastraDBMessage[] | undefined;
  statedCheckIn: string | undefined;
  statedGuests: number | undefined;
}): { checkInDate?: string; guests?: number } => {
  const { messages, statedCheckIn, statedGuests } = args;
  if (!statedCheckIn && !statedGuests) return {};

  const latestUserMessage = messages?.length
    ? findLatestUserMessage(messages)
    : undefined;
  const latestText = latestUserMessage
    ? extractMessageText(latestUserMessage)
    : "";

  return {
    ...(statedCheckIn && hasStatedCheckInCue(latestText)
      ? { checkInDate: statedCheckIn }
      : {}),
    ...(statedGuests && hasStatedGuestCue(latestText)
      ? { guests: statedGuests }
      : {}),
  };
};
