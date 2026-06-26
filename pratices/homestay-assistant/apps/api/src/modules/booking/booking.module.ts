import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { RoomsModule } from '../rooms/rooms.module';
import { BookingController } from './controllers/booking.controller';
import { BookingEntity } from './entities/booking.entity';
import { BookingRepository } from './repositories/booking.repository';
import { BookingService } from './services/booking.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity, UserEntity]), RoomsModule],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
