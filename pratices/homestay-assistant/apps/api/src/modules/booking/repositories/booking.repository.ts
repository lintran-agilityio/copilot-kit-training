import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { toDateKey, startOfDay, ACTIVE_BOOKING_STATUSES } from '@/utils';
import { ListBookingsQueryDto } from '@/modules/booking/dto/list-bookings-query.dto';
import { BookingEntity } from '@/modules/booking/entities/booking.entity';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async findAll(
    filters: ListBookingsQueryDto & { userId: string },
  ): Promise<BookingEntity[]> {
    // checkOutDate is a date-only column — compare against today's date key
    // (not a full timestamp) so a stay checking out today still counts as
    // active for the whole checkout day, matching the agent's isActiveBooking.
    const today = toDateKey(startOfDay(new Date()));

    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .where('booking.cancelledAt IS NULL')
      .andWhere('booking.checkOutDate >= :today', { today })
      .andWhere('booking.userId = :userId', { userId: filters.userId })
      // Secondary tie-break on id — checkInDate alone is not unique, so
      // repeated identical requests could otherwise return rows in a
      // different order (Postgres does not guarantee stable order for ties).
      .orderBy('booking.checkInDate', 'ASC')
      .addOrderBy('booking.id', 'ASC');

    if (filters.roomId) {
      query.andWhere('booking.roomId = :roomId', { roomId: filters.roomId });
    }

    if (filters.roomName?.trim()) {
      query.andWhere('LOWER(room.name) LIKE LOWER(:roomName)', {
        roomName: `%${filters.roomName.trim()}%`,
      });
    }

    if (filters.status) {
      query.andWhere('booking.status = :status', { status: filters.status });
    }

    // Stay covers onDate: checkIn <= onDate AND checkOut > onDate (exclusive checkout).
    if (filters.onDate) {
      query
        .andWhere('booking.checkInDate <= :onDate', { onDate: filters.onDate })
        .andWhere('booking.checkOutDate > :onDate', { onDate: filters.onDate });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<BookingEntity | null> {
    return this.bookingRepository.findOne({
      where: { id },
      relations: { room: true },
    });
  }

  async save(booking: Partial<BookingEntity>): Promise<BookingEntity> {
    return this.bookingRepository.save(booking);
  }

  async hasOverlappingBooking(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.status IN (:...activeStatuses)', {
        activeStatuses: ACTIVE_BOOKING_STATUSES,
      })
      .andWhere('booking.checkInDate < :checkOutDate', {
        checkOutDate: toDateKey(checkOutDate),
      })
      .andWhere('booking.checkOutDate > :checkInDate', {
        checkInDate: toDateKey(checkInDate),
      });

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const overlapCount = await query.getCount();
    return overlapCount > 0;
  }
}
