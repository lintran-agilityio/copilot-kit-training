import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base/entity';
import { BookingStatus } from '../../../database/entities/enums';
import { RoomEntity } from './room.entity';

@Entity('bookings')
export class BookingEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => RoomEntity, (room) => room.bookings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  @Column({ name: 'check_in_date', type: 'date' })
  checkInDate: string;

  @Column({ name: 'check_out_date', type: 'date' })
  checkOutDate: string;

  @Column()
  guests: number;

  @Column({ name: 'total_price' })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    enumName: 'BookingStatus',
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;
}
