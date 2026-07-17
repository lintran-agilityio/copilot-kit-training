import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_OVERLAP_JOIN_CONDITION,
} from '@/utils';
import { BookingEntity } from '@/modules/booking/entities/booking.entity';
import { RoomEntity } from '@/modules/rooms/entities/room.entity';

@Injectable()
export class RoomsRepository {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async findAll(): Promise<RoomEntity[]> {
    return this.roomRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string, userId?: string): Promise<RoomEntity | null> {
    if (!userId) {
      return this.roomRepository.findOne({ where: { id } });
    }

    return this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect(
        'room.bookings',
        'booking',
        'booking.userId = :userId AND booking.status IN (:...activeStatuses)',
        { userId, activeStatuses: ACTIVE_BOOKING_STATUSES },
      )
      .where('room.id = :id', { id })
      .orderBy('booking.createdAt', 'DESC')
      .getOne();
  }

  async findAvailableBetween(
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<RoomEntity[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('room.bookings', 'booking', BOOKING_OVERLAP_JOIN_CONDITION, {
        activeStatuses: ACTIVE_BOOKING_STATUSES,
        checkOutDate,
        checkInDate,
      })
      .where('room.availableSlots > 0')
      .andWhere('booking.id IS NULL')
      .orderBy('room.name', 'ASC')
      .getMany();
  }

  /**
   * Finds rooms matching optional name, capacity, level, and availability filters.
   *
   * @param filters - Combined search/filter criteria; omit a field to skip it
   * @returns Matching rooms ordered by name
   */
  async findByFilters(filters: {
    name?: string;
    guests?: number;
    level?: number;
    checkInDate?: Date;
    checkOutDate?: Date;
  }): Promise<RoomEntity[]> {
    const qb = this.roomRepository.createQueryBuilder('room');

    if (filters.checkInDate && filters.checkOutDate) {
      qb.leftJoin('room.bookings', 'booking', BOOKING_OVERLAP_JOIN_CONDITION, {
        activeStatuses: ACTIVE_BOOKING_STATUSES,
        checkOutDate: filters.checkOutDate,
        checkInDate: filters.checkInDate,
      })
        .andWhere('room.availableSlots > 0')
        .andWhere('booking.id IS NULL');
    }

    if (filters.name?.trim()) {
      qb.andWhere('LOWER(room.name) LIKE LOWER(:name)', {
        name: `%${filters.name.trim()}%`,
      });
    }

    if (filters.guests != null && !Number.isNaN(filters.guests)) {
      qb.andWhere('room.capacity >= :guests', { guests: filters.guests });
    }

    if (filters.level != null && !Number.isNaN(filters.level)) {
      qb.andWhere('room.level = :level', { level: filters.level });
    }

    return qb.orderBy('room.name', 'ASC').getMany();
  }

  async findActiveBookingByRoomAndUser(
    roomId: string,
    userId: string,
  ): Promise<BookingEntity | null> {
    return this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.userId = :userId', { userId })
      .andWhere('booking.status IN (:...activeStatuses)', {
        activeStatuses: ACTIVE_BOOKING_STATUSES,
      })
      .orderBy('booking.createdAt', 'DESC')
      .getOne();
  }

  async hasOverlappingActiveBooking(
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
  ): Promise<boolean> {
    const overlapCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('booking.status IN (:...activeStatuses)', {
        activeStatuses: ACTIVE_BOOKING_STATUSES,
      })
      .andWhere('booking.checkInDate < :checkOutDate', { checkOutDate })
      .andWhere('booking.checkOutDate > :checkInDate', { checkInDate })
      .getCount();

    return overlapCount > 0;
  }
}
