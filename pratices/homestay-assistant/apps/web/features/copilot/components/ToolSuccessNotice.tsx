"use client";

import { useEffect, useRef } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmSuccess } from "@/components/confirm-modal";
import { ChatGenerativeUILayout } from "@/features/chat/components";
import { Loading } from "@repo/components";
import { cn, parseToolResult } from "@repo/utils";

import type { ToolRendererProps } from "@/features/copilot/types";

export type ToolSuccessDisplayResult = {
  id?: string;
  room?: { name?: string };
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  totalPrice?: number;
};

export type ToolSuccessNoticeProps<TResult extends ToolSuccessDisplayResult> =
  ToolRendererProps<TResult> & {
    title: string;
    description: string;
    isSuccess: (result?: TResult | string | null) => boolean;
    onSuccess?: () => void;
  };

export function ToolSuccessNotice<TResult extends ToolSuccessDisplayResult>({
  status,
  result,
  title,
  description,
  isSuccess,
  onSuccess,
}: ToolSuccessNoticeProps<TResult>) {
  const sideEffectRan = useRef(false);

  useEffect(() => {
    if (
      status === ToolCallStatus.Complete &&
      isSuccess(result) &&
      !sideEffectRan.current
    ) {
      sideEffectRan.current = true;
      onSuccess?.();
    }
  }, [status, result, isSuccess, onSuccess]);

  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <ChatGenerativeUILayout
        className={cn(
          "rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400",
        )}
      >
        <Loading />
      </ChatGenerativeUILayout>
    );
  }

  if (status === ToolCallStatus.Complete && isSuccess(result)) {
    const parsed = parseToolResult<TResult>(result);

    return (
      <ChatGenerativeUILayout>
        <ConfirmSuccess
          title={title}
          description={description}
          id={parsed?.id}
          name={parsed?.room?.name}
          checkInDate={parsed?.checkInDate}
          checkOutDate={parsed?.checkOutDate}
          guests={parsed?.guests}
          totalPrice={parsed?.totalPrice}
        />
      </ChatGenerativeUILayout>
    );
  }

  return null;
}
