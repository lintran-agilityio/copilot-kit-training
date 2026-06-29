import { BadRequestException } from '@nestjs/common';

export const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const isEmptyDateValue = (
  value: string | null | undefined,
): value is null | undefined | '' => {
  return value == null || value.trim() === '';
};

export const resolveDateOrToday = (value?: string | null): Date => {
  if (isEmptyDateValue(value)) {
    return startOfDay(new Date());
  }

  return parseRequiredDate(value);
};

export const parseRequiredDate = (value: string, fieldName = 'date'): Date => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      `Invalid ${fieldName} format. Use an ISO 8601 date (YYYY-MM-DD).`,
    );
  }

  return startOfDay(parsed);
};

export const toDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const countNights = (checkIn: string, checkOut: string): number => {
  const checkInDate = parseRequiredDate(checkIn, 'checkInDate');
  const checkOutDate = parseRequiredDate(checkOut, 'checkOutDate');

  return Math.max(
    1,
    Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
};

export const parseDateRange = (
  checkIn: string,
  checkOut: string,
): { checkInDate: Date; checkOutDate: Date; nights: number } => {
  const checkInDate = parseRequiredDate(checkIn, 'checkInDate');
  const checkOutDate = parseRequiredDate(checkOut, 'checkOutDate');

  if (checkOutDate <= checkInDate) {
    throw new BadRequestException('checkOutDate must be after checkInDate.');
  }

  return {
    checkInDate,
    checkOutDate,
    nights: countNights(checkIn, checkOut),
  };
};
