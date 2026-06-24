import { BadRequestException } from '@nestjs/common';

export function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isEmptyDateValue(
  value: string | null | undefined,
): value is null | undefined | '' {
  return value == null || value.trim() === '';
}

export function resolveDateOrToday(value?: string | null): Date {
  if (isEmptyDateValue(value)) {
    return startOfDay(new Date());
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      'Invalid date format. Use an ISO 8601 date (YYYY-MM-DD).',
    );
  }

  return startOfDay(parsed);
}
