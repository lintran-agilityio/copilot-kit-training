import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_OVERLAP_JOIN_CONDITION,
} from '../../../utils/booking-overlap.util';
import { RoomEntity } from '../entities/room.entity';

@Injectable()
export class RoomsRepository {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
  ) {}

  async findAll(): Promise<RoomEntity[]> {
    return this.roomRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<RoomEntity | null> {
    return this.roomRepository.findOne({ where: { id } });
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
}
