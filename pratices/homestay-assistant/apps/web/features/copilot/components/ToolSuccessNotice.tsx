"use client";

import { useEffect, useRef } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmSuccess } from "@/components/confirm-modal";
import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";

import type { ToolRendererProps } from "@/features/copilot/types";

export type ToolSuccessDisplayResult = {
  id?: string;
  room?: { name?: string };
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
    return <Loading />;
  }

  if (status === ToolCallStatus.Complete && isSuccess(result)) {
    const parsed = parseToolResult<TResult>(result);

    return (
      <ConfirmSuccess
        title={title}
        description={description}
        id={parsed?.id}
        name={parsed?.room?.name}
      />
    );
  }

  return null;
}
