import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BookingStatus } from '../../../database/entities/enums';
import { UserEntity } from '../../../database/entities/user.entity';
import { parseDateRange, toDateKey } from '../../../utils/date-utils';
import { RoomsRepository } from '../../rooms/repositories/rooms.repository';
import { RoomEntity } from '../../rooms/entities/room.entity';
import {
  AvailabilityResponseDto,
  BookingResponseDto,
  CheckAvailabilityQueryDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingDto,
} from '../dto';
import { toBookingResponseDto } from '../mappers/booking.mapper';
import { BookingRepository } from '../repositories/booking.repository';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly roomsRepository: RoomsRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    this.assertRequiredFields(dto, [
      'roomId',
      'userId',
      'checkInDate',
      'checkOutDate',
      'guests',
    ]);
    this.assertPositiveGuests(dto.guests);

    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id "${dto.userId}" not found`);
    }

    const room = await this.getRoomOrThrow(dto.roomId);
    this.assertGuestCapacity(room, dto.guests);
    this.assertRoomHasSlots(room);

    const { checkInDate, checkOutDate, nights } = parseDateRange(
      dto.checkInDate,
      dto.checkOutDate,
    );

    await this.assertRoomAvailable(room.id, checkInDate, checkOutDate);

    const status = dto.status ?? BookingStatus.PENDING;
    this.assertValidStatus(status);

    const now = new Date();
    const booking = await this.bookingRepository.save({
      id: crypto.randomUUID(),
      userId: dto.userId,
      roomId: dto.roomId,
      checkInDate: toDateKey(checkInDate),
      checkOutDate: toDateKey(checkOutDate),
      guests: dto.guests,
      totalPrice: nights * room.pricePerNight,
      status,
      updatedAt: now,
    });

    const created = await this.bookingRepository.findById(booking.id);
    return toBookingResponseDto(created ?? booking);
  }

  async findAll(
    query: ListBookingsQueryDto = {},
  ): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.findAll(query);
    return bookings.map(toBookingResponseDto);
  }

  async findById(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }

    return toBookingResponseDto(booking);
  }

  async checkAvailability(
    query: CheckAvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    this.assertRequiredFields(query, ['roomId', 'checkInDate', 'checkOutDate']);

    const room = await this.getRoomOrThrow(query.roomId);
    const { checkInDate, checkOutDate } = parseDateRange(
      query.checkInDate,
      query.checkOutDate,
    );

    const available = await this.isRoomAvailable(
      room,
      checkInDate,
      checkOutDate,
    );

    return {
      available,
      roomId: query.roomId,
      checkInDate: query.checkInDate,
      checkOutDate: query.checkOutDate,
    };
  }

  async update(id: string, dto: UpdateBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bookings cannot be updated');
    }

    if (dto.status) {
      this.assertValidStatusTransition(booking.status, dto.status);
    }

    const nextCheckInDate = dto.checkInDate ?? booking.checkInDate;
    const nextCheckOutDate = dto.checkOutDate ?? booking.checkOutDate;
    const nextGuests = dto.guests ?? booking.guests;

    this.assertPositiveGuests(nextGuests);

    const { checkInDate, checkOutDate, nights } = parseDateRange(
      nextCheckInDate,
      nextCheckOutDate,
    );

    const room = await this.getRoomOrThrow(booking.roomId);
    this.assertGuestCapacity(room, nextGuests);
    this.assertRoomHasSlots(room);

    const nextStatus = dto.status ?? booking.status;

    if (nextStatus !== BookingStatus.CANCELLED) {
      const shouldRecheckAvailability =
        dto.checkInDate !== undefined || dto.checkOutDate !== undefined;

      if (shouldRecheckAvailability) {
        await this.assertRoomAvailable(
          booking.roomId,
          checkInDate,
          checkOutDate,
          booking.id,
        );
      }
    }

    const updated = await this.bookingRepository.save({
      ...booking,
      checkInDate: toDateKey(checkInDate),
      checkOutDate: toDateKey(checkOutDate),
      guests: nextGuests,
      totalPrice: nights * room.pricePerNight,
      status: nextStatus,
      updatedAt: new Date(),
    });

    const refreshed = await this.bookingRepository.findById(updated.id);
    return toBookingResponseDto(refreshed ?? updated);
  }

  async cancel(id: string): Promise<BookingResponseDto> {
    return this.update(id, { status: BookingStatus.CANCELLED });
  }

  private async getRoomOrThrow(roomId: string): Promise<RoomEntity> {
    const room = await this.roomsRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException(`Room with id "${roomId}" not found`);
    }

    return room;
  }

  private async isRoomAvailable(
    room: RoomEntity,
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<boolean> {
    if (room.availableSlots <= 0) {
      return false;
    }

    const hasOverlap = await this.bookingRepository.hasOverlappingBooking(
      room.id,
      checkInDate,
      checkOutDate,
    );

    return !hasOverlap;
  }

  private async assertRoomAvailable(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const room = await this.getRoomOrThrow(roomId);
    this.assertRoomHasSlots(room);

    const hasOverlap = await this.bookingRepository.hasOverlappingBooking(
      roomId,
      checkInDate,
      checkOutDate,
      excludeBookingId,
    );

    if (hasOverlap) {
      throw new ConflictException(
        `Room "${roomId}" is not available for the selected dates`,
      );
    }
  }

  private assertGuestCapacity(room: RoomEntity, guests: number): void {
    if (guests > room.capacity) {
      throw new BadRequestException(
        `Guest count (${guests}) exceeds room capacity (${room.capacity})`,
      );
    }
  }

  private assertRoomHasSlots(room: RoomEntity): void {
    if (room.availableSlots <= 0) {
      throw new ConflictException(`Room "${room.id}" has no available slots`);
    }
  }

  private assertPositiveGuests(guests: number): void {
    if (!Number.isInteger(guests) || guests < 1) {
      throw new BadRequestException('guests must be a positive integer');
    }
  }

  private assertRequiredFields<T extends object>(
    dto: T,
    fields: (keyof T)[],
  ): void {
    for (const field of fields) {
      const value = dto[field];

      if (value == null || (typeof value === 'string' && value.trim() === '')) {
        throw new BadRequestException(`${String(field)} is required`);
      }
    }
  }

  private assertValidStatus(status: BookingStatus): void {
    if (!Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException(`Invalid booking status "${status}"`);
    }
  }

  private assertValidStatusTransition(
    current: BookingStatus,
    next: BookingStatus,
  ): void {
    if (current === next) {
      return;
    }

    if (current === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bookings cannot change status');
    }

    if (current === BookingStatus.CONFIRMED && next === BookingStatus.PENDING) {
      throw new BadRequestException(
        'Confirmed bookings cannot revert to pending',
      );
    }
  }
}
