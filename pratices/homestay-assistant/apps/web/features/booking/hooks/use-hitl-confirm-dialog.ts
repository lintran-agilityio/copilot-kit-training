import { useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import {
  isHitlToolFinished,
  isHitlToolRespondable,
  resolveHitlDecisionStatus,
  useHitlRespondOnce,
  type HitlDecisionStatus,
} from "@/features/booking/utils";

export type HitlConfirmDialogResult =
  | { confirmed: false }
  | { confirmed: true; [key: string]: unknown };

export const useHitlConfirmDialog = <
  TResult extends HitlConfirmDialogResult,
>(
  status: ToolCallStatus,
  respond: ((result: TResult) => Promise<void>) | undefined,
  defaultErrorMessage: string,
  result?: unknown,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { respondOnce, canRespond } = useHitlRespondOnce<TResult>(respond);

  const isAwaiting = isHitlToolRespondable(status, respond);
  const isFinished = isHitlToolFinished(status);
  const shouldRender = isAwaiting || isFinished;
  const decisionStatus: HitlDecisionStatus = resolveHitlDecisionStatus(
    status,
    result,
  );

  const handleDismiss = () => {
    if (!canRespond) {
      return;
    }

    void respondOnce({ confirmed: false } as TResult);
  };

  const confirm = async (
    confirmedResult: Extract<TResult, { confirmed: true }>,
  ) => {
    if (!canRespond) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await respondOnce(confirmedResult as TResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : defaultErrorMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    decisionStatus,
    handleDismiss,
    confirm,
  };
};
