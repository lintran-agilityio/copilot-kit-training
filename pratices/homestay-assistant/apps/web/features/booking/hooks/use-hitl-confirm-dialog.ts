import { useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { isHitlToolRespondable, useHitlRespondOnce } from "@/features/booking/utils";

export type HitlConfirmDialogResult =
  | { confirmed: false }
  | { confirmed: true; [key: string]: unknown };

export const useHitlConfirmDialog = <
  TResult extends HitlConfirmDialogResult,
>(
  status: ToolCallStatus,
  respond: ((result: TResult) => Promise<void>) | undefined,
  defaultErrorMessage: string,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { respondOnce, canRespond } = useHitlRespondOnce<TResult>(respond);

  const isVisible = isHitlToolRespondable(status, respond);

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
    isVisible,
    isSubmitting,
    errorMessage,
    canRespond,
    handleDismiss,
    confirm,
  };
};
