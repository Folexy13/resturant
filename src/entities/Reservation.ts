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
import { Table } from './Table';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('reservations')
@Index(['restaurantId', 'reservationDate'])
@Index(['tableId', 'reservationDate', 'startTime', 'endTime'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId!: string;

  @Column({ type: 'uuid', name: 'table_id' })
  tableId!: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'varchar', length: 20, name: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_email', nullable: true })
  customerEmail?: string;

  @Column({ type: 'int', name: 'party_size' })
  partySize!: number;

  @Column({ type: 'date', name: 'reservation_date' })
  reservationDate!: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({ type: 'text', name: 'special_requests', nullable: true })
  specialRequests?: string;

  @Column({ type: 'boolean', name: 'confirmation_sent', default: false })
  confirmationSent!: boolean;

  @Column({ type: 'timestamp', name: 'confirmed_at', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'varchar', length: 255, name: 'cancellation_reason', nullable: true })
  cancellationReason?: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reservations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @ManyToOne(() => Table, (table) => table.reservations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'table_id' })
  table!: Table;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper method to check if reservation overlaps with another time range
  overlapsWithTimeRange(startTime: string, endTime: string): boolean {
    const thisStart = this.timeToMinutes(this.startTime);
    const thisEnd = this.timeToMinutes(this.endTime);
    const otherStart = this.timeToMinutes(startTime);
    const otherEnd = this.timeToMinutes(endTime);

    // Two time ranges overlap if one starts before the other ends
    return thisStart < otherEnd && otherStart < thisEnd;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Check if reservation can be cancelled
  canBeCancelled(): boolean {
    return [ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(this.status);
  }

  // Check if reservation can be modified
  canBeModified(): boolean {
    return [ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(this.status);
  }
}