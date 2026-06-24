import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../modules/rooms/entities/booking.entity';
import { RoomEntity } from '../modules/rooms/entities/room.entity';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [RoomEntity, BookingEntity],
      synchronize: false,
    }),
  ],
  providers: [PrismaService],
  exports: [TypeOrmModule, PrismaService],
})
export class DatabaseModule {}
