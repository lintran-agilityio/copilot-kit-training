import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { extractRoomNameQuery } from '@repo/utils';

import { BookingStatus } from '../../../types/enum';
import { UserEntity } from '@/database/entities/user.entity';
import { parseDateRange, toDateKey } from '@/utils';
import { RoomsRepository } from '@/modules/rooms/repositories/rooms.repository';
import { RoomEntity } from '@/modules/rooms/entities/room.entity';
import {
  AvailabilityResponseDto,
  BookingResponseDto,
  CheckAvailabilityQueryDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingDto,
} from '@/modules/booking/dto';
import { CancellationBookingSummaryDto } from '@/modules/booking/dto/cancellation-booking-summary.dto';
import { FindBookingsByRoomQueryDto } from '@/modules/booking/dto/find-bookings-by-room-query.dto';
import { FindBookingsByRoomResponseDto } from '@/modules/booking/dto/find-bookings-by-room-response.dto';
import { BookingEntity } from '@/modules/booking/entities/booking.entity';
import { toBookingResponseDto } from '@/modules/booking/mappers/booking.mapper';
import { BookingRepository } from '@/modules/booking/repositories/booking.repository';
import { toRoomResponseDto } from '@/modules/rooms/mappers/room.mapper';

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

    await this.findOrCreateUser(dto.userId);

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

  async findByRoomName(
    query: FindBookingsByRoomQueryDto,
  ): Promise<FindBookingsByRoomResponseDto> {
    const rawName = query.roomName.trim();

    if (!rawName) {
      return { bookings: [], queryName: '' };
    }

    const queryName = extractRoomNameQuery(rawName) || rawName;

    const bookings = await this.bookingRepository.findBookingByName(
      query.userId,
      rawName,
    );

    return {
      bookings: bookings.map((booking) => this.toCancellationSummary(booking)),
      queryName,
    };
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

    const datesAvailable = await this.isRoomAvailable(
      room,
      checkInDate,
      checkOutDate,
      query.excludeBookingId,
    );

    const guests = this.parseOptionalGuests(query.guests);

    let guestsWithinCapacity = true;
    if (guests != null) {
      this.assertPositiveGuests(guests);
      guestsWithinCapacity = guests <= room.capacity;
    }

    return {
      available: datesAvailable && guestsWithinCapacity,
      guestsWithinCapacity,
      room: toRoomResponseDto(room),
      checkInDate: query.checkInDate,
      checkOutDate: query.checkOutDate,
      ...(guests != null ? { guests } : {}),
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

    const now = new Date();
    const updated = await this.bookingRepository.save({
      ...booking,
      checkInDate: toDateKey(checkInDate),
      checkOutDate: toDateKey(checkOutDate),
      guests: nextGuests,
      totalPrice: nights * room.pricePerNight,
      status: nextStatus,
      cancelledAt:
        nextStatus === BookingStatus.CANCELLED ? now : booking.cancelledAt,
      updatedAt: now,
    });

    const refreshed = await this.bookingRepository.findById(updated.id);
    return toBookingResponseDto(refreshed ?? updated);
  }

  async cancel(id: string): Promise<BookingResponseDto> {
    return this.update(id, { status: BookingStatus.CANCELLED });
  }

  private toCancellationSummary(
    booking: BookingEntity,
  ): CancellationBookingSummaryDto {
    const roomName = booking.room?.name ?? '';

    return {
      bookingId: booking.id,
      roomId: booking.roomId,
      roomName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
    };
  }

  private async findOrCreateUser(userId: string): Promise<UserEntity> {
    const existing = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (existing) {
      return existing;
    }

    return this.userRepository.save({
      id: userId,
      email: `${userId}@users.local`,
      name: null,
      password: 'n/a',
      updatedAt: new Date(),
    });
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
    excludeBookingId?: string,
  ): Promise<boolean> {
    if (room.availableSlots <= 0) {
      return false;
    }

    const hasOverlap = await this.bookingRepository.hasOverlappingBooking(
      room.id,
      checkInDate,
      checkOutDate,
      excludeBookingId,
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

  private parseOptionalGuests(guests?: number | string): number | undefined {
    if (guests == null || guests === '') {
      return undefined;
    }

    const parsed = typeof guests === 'number' ? guests : Number(guests);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('guests must be a positive integer');
    }

    return parsed;
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
