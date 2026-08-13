import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ClerkAuthGuard, CurrentUser, type ClerkAuthUser } from '@/auth';
import {
  UpdateBookingDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  BookingResponseDto,
  CheckAvailabilityQueryDto,
  AvailabilityResponseDto,
} from '@/modules/booking/dto';
import { BookingService } from '@/modules/booking/services/booking.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiCreatedResponse({ type: BookingResponseDto })
  create(
    @CurrentUser() user: ClerkAuthUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.create(dto, user.userId);
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
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List bookings for the signed-in user' })
  @ApiOkResponse({ type: BookingResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: ClerkAuthUser,
    @Query() query: ListBookingsQueryDto,
  ): Promise<BookingResponseDto[]> {
    return this.bookingService.findAll(query, user.userId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiOkResponse({ type: BookingResponseDto })
  findById(
    @CurrentUser() user: ClerkAuthUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.findById(id, user.userId);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  update(
    @CurrentUser() user: ClerkAuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiOkResponse({ type: BookingResponseDto })
  cancel(
    @CurrentUser() user: ClerkAuthUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.cancel(id, user.userId);
  }
}
