import { CheckCircle } from "lucide-react";

import { formatPrice, formatShortDateForDisplay } from "@repo/utils";

type ConfirmSuccessProps = {
  title: string;
  description: string;
  id?: string;
  name?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  totalPrice?: number;
};

export const ConfirmSuccess = ({
  title,
  description,
  id,
  name,
  checkInDate,
  checkOutDate,
  guests,
  totalPrice,
}: ConfirmSuccessProps) => {
  const hasBookingDetails =
    checkInDate || checkOutDate || guests != null || totalPrice != null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-9 w-9 text-green-600 dark:text-green-500" />
        </div>

        <div className="space-y-1">
          {title && (
            <h3 className="font-medium text-green-900 text-lg">{title}</h3>
          )}

          {description && (
            <p className="mt-1 text-base text-green-700">{description}</p>
          )}

          {(name) && (
            <p className="mt-2 text-base text-green-600">
              {`Room: ${name}`}
             
            </p>
          )}
          {(id) && (
            <p className="mt-2 text-base text-green-600">
              {`ID: ${id}`}
            </p>
          )}

          {hasBookingDetails && (
            <dl className="mt-3 space-y-1 text-sm text-green-800">
              {checkInDate && (
                <div className="flex gap-2">
                  <dt className="font-medium">Check-in:</dt>
                  <dd>{formatShortDateForDisplay(checkInDate)}</dd>
                </div>
              )}
              {checkOutDate && (
                <div className="flex gap-2">
                  <dt className="font-medium">Check-out:</dt>
                  <dd>{formatShortDateForDisplay(checkOutDate)}</dd>
                </div>
              )}
              {guests != null && (
                <div className="flex gap-2">
                  <dt className="font-medium">Guests:</dt>
                  <dd>{guests}</dd>
                </div>
              )}
              {totalPrice != null && (
                <div className="flex gap-2">
                  <dt className="font-medium">Total Price:</dt>
                  <dd>{formatPrice(totalPrice)}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};
