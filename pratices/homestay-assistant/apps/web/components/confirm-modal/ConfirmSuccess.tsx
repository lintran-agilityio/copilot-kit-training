import { CheckCircle } from "lucide-react";

import { formatPrice, formatShortDateForDisplay } from "@repo/utils";

type ConfirmSuccessProps = {
  title: string;
  name?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  totalPrice?: number;
};

export const ConfirmSuccess = ({
  title,
  name,
  checkInDate,
  checkOutDate,
  guests,
  totalPrice,
}: ConfirmSuccessProps) => {
  const hasBookingDetails =
    checkInDate || checkOutDate || guests != null || totalPrice != null;

  return (
    <div className="p-3.5">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle className="size-4 text-emerald-400" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {title ? (
            <h3 className="text-sm font-medium text-emerald-300">{title}</h3>
          ) : null}
          {name ? (
            <p className="text-xs text-zinc-300">{`Room: ${name}`}</p>
          ) : null}

          {hasBookingDetails ? (
            <dl className="mt-2 space-y-0.5 border-t border-white/8 pt-2 text-xs text-zinc-300">
              <div className="flex gap-2">
                {checkInDate ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-zinc-500">Check-in:</dt>
                    <dd>{formatShortDateForDisplay(checkInDate)}</dd>
                  </div>
                ) : null}
                {guests != null ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-zinc-500">Guests:</dt>
                    <dd>{guests}</dd>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                {checkOutDate ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-zinc-500">Check-out:</dt>
                    <dd>{formatShortDateForDisplay(checkOutDate)}</dd>
                  </div>
                ) : null}

                {totalPrice != null ? (
                  <div className="flex gap-2">
                    <dt className="font-medium text-zinc-500">Total:</dt>
                    <dd>{formatPrice(totalPrice)}</dd>
                  </div>
                ) : null}
              </div>
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
};
