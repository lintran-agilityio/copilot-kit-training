import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './controllers/rooms.controller';
import { BookingEntity } from './entities/booking.entity';
import { RoomEntity } from './entities/room.entity';
import { RoomsRepository } from './repositories/rooms.repository';
import { RoomsDateService } from './services/rooms-date.service';
import { RoomsService } from './services/rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoomEntity, BookingEntity])],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsDateService, RoomsRepository],
  exports: [RoomsService],
})
export class RoomsModule {}
