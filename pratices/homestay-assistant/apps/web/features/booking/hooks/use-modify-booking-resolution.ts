"use client";

import { useMemo } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, MESSAGE_ROLE, TOOL_KEYS } from "@repo/constants";
import {
  parseToolResult,
  selectConfirmModifyStayFromResult,
  type ConfirmModifyStayResolution,
} from "@repo/utils";

import type { MessageLike } from "@/features/chatbot/types";
import type { FindBookingByIdResult } from "@/features/booking/types";
import type { Room } from "@/features/room/types/room";

/**
 * `confirm_modify_booking` args are model-authored on the stated-change MODIFY
 * path (the step machine forces the call after `find_booking_by_id` probes
 * availability). A weak model routinely fills `checkOutDate` with the booking's
 * ORIGINAL check-out instead of the probed one, or drops the `room` object —
 * either way the confirm card hides itself (no before → after diff, or missing
 * room). Hydrate the authoritative merged stay + room + originals straight from
 * the latest resolved `find_booking_by_id` result in the transcript instead.
 *
 * Returns `null` for the no-stated-change / edit-form path (that result carries
 * no `availability` block — `pendingModifyStay` owns the confirm card there)
 * and for a taken / over-capacity probe (the turn stops, no confirm card).
 */
export const useModifyBookingResolution = (
  bookingId?: string,
): ConfirmModifyStayResolution<Room> | null => {
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });
  const messages = agent.messages as MessageLike[] | undefined;

  return useMemo(() => {
    if (!messages?.length) {
      return null;
    }

    const findByIdCallIds = new Set<string>();
    for (const message of messages) {
      if (message.role !== MESSAGE_ROLE.ASSISTANT) {
        continue;
      }
      for (const toolCall of message.toolCalls ?? []) {
        const name = toolCall.function?.name ?? toolCall.name;
        if (name === TOOL_KEYS.BOOKING.FIND_BY_ID && toolCall.id) {
          findByIdCallIds.add(toolCall.id);
        }
      }
    }

    if (findByIdCallIds.size === 0) {
      return null;
    }

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (
        message?.role !== MESSAGE_ROLE.TOOL ||
        !message.toolCallId ||
        !findByIdCallIds.has(message.toolCallId)
      ) {
        continue;
      }

      const parsed = parseToolResult<FindBookingByIdResult>(
        message.content as FindBookingByIdResult | string | null | undefined,
      );
      const resolution = selectConfirmModifyStayFromResult<Room>(
        parsed,
        bookingId,
      );
      if (resolution) {
        return resolution;
      }
    }

    return null;
  }, [messages, bookingId]);
};
