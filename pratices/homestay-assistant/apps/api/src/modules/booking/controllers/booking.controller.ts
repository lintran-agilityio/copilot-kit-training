import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AvailabilityResponseDto } from '../dto/availability-response.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { CheckAvailabilityQueryDto } from '../dto/check-availability-query.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { ListBookingsQueryDto } from '../dto/list-bookings-query.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { BookingService } from '../services/booking.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiCreatedResponse({ type: BookingResponseDto })
  create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.bookingService.create(dto);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check room availability for a date range' })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  checkAvailability(
    @Query() query: CheckAvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.bookingService.checkAvailability(query);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings with optional filters' })
  @ApiOkResponse({ type: BookingResponseDto, isArray: true })
  findAll(@Query() query: ListBookingsQueryDto): Promise<BookingResponseDto[]> {
    return this.bookingService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiOkResponse({ type: BookingResponseDto })
  findById(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingService.cancel(id);
  }
}
