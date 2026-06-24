import { Injectable } from '@nestjs/common';
import { resolveDateOrToday } from '../../../utils/date.util';

@Injectable()
export class RoomsDateService {
  resolveCheckInDate(date?: string | null): Date {
    return resolveDateOrToday(date);
  }
}
