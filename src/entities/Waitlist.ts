import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Restaurant } from './Restaurant';

export enum WaitlistStatus {
  WAITING = 'waiting',
  NOTIFIED = 'notified',
  SEATED = 'seated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('waitlist')
@Index(['restaurantId', 'requestedDate', 'status'])
export class Waitlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId!: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'varchar', length: 20, name: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_email', nullable: true })
  customerEmail?: string;

  @Column({ type: 'int', name: 'party_size' })
  partySize!: number;

  @Column({ type: 'date', name: 'requested_date' })
  requestedDate!: string;

  @Column({ type: 'time', name: 'preferred_start_time' })
  preferredStartTime!: string;

  @Column({ type: 'time', name: 'preferred_end_time' })
  preferredEndTime!: string;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({
    type: 'enum',
    enum: WaitlistStatus,
    default: WaitlistStatus.WAITING,
  })
  status!: WaitlistStatus;

  @Column({ type: 'int', default: 0, name: 'notification_count' })
  notificationCount!: number;

  @Column({ type: 'timestamp', name: 'last_notified_at', nullable: true })
  lastNotifiedAt?: Date;

  @Column({ type: 'text', name: 'special_requests', nullable: true })
  specialRequests?: string;

  @Column({ type: 'uuid', name: 'converted_reservation_id', nullable: true })
  convertedReservationId?: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.waitlistEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Check if waitlist entry can be notified
  canBeNotified(): boolean {
    return this.status === WaitlistStatus.WAITING;
  }

  // Check if waitlist entry is still valid
  isValid(): boolean {
    return [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED].includes(this.status);
  }
}