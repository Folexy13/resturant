import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Restaurant } from './Restaurant';
import { Table } from './Table';
import { Reservation } from './Reservation';
import { User } from './User';

export enum RecurrencePattern {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum RecurringReservationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('recurring_reservations')
export class RecurringReservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId!: string;

  @Column({ type: 'uuid', name: 'table_id', nullable: true })
  tableId?: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'varchar', length: 20, name: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: 'varchar', length: 255, name: 'customer_email', nullable: true })
  customerEmail?: string;

  @Column({ type: 'int', name: 'party_size' })
  partySize!: number;

  @Column({
    type: 'enum',
    enum: RecurrencePattern,
    name: 'recurrence_pattern',
  })
  recurrencePattern!: RecurrencePattern;

  @Column({ type: 'int', name: 'day_of_week', nullable: true })
  dayOfWeek?: number; // 0-6 for weekly/biweekly

  @Column({ type: 'int', name: 'day_of_month', nullable: true })
  dayOfMonth?: number; // 1-31 for monthly

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate?: string;

  @Column({ type: 'int', name: 'max_occurrences', nullable: true })
  maxOccurrences?: number;

  @Column({ type: 'int', name: 'occurrences_created', default: 0 })
  occurrencesCreated!: number;

  @Column({
    type: 'enum',
    enum: RecurringReservationStatus,
    default: RecurringReservationStatus.ACTIVE,
  })
  status!: RecurringReservationStatus;

  @Column({ type: 'text', name: 'special_requests', nullable: true })
  specialRequests?: string;

  @Column({ type: 'date', name: 'next_occurrence_date', nullable: true })
  nextOccurrenceDate?: string;

  @Column({ type: 'date', name: 'last_occurrence_date', nullable: true })
  lastOccurrenceDate?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: Restaurant;

  @ManyToOne(() => Table, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'table_id' })
  table?: Table;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => Reservation, (reservation) => reservation.recurringReservation)
  reservations?: Reservation[];

  calculateEndTime(): string {
    const [hours, minutes] = this.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + this.durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  isActive(): boolean {
    return this.status === RecurringReservationStatus.ACTIVE;
  }

  canCreateMoreOccurrences(): boolean {
    if (!this.isActive()) return false;
    if (this.maxOccurrences && this.occurrencesCreated >= this.maxOccurrences) return false;
    if (this.endDate && new Date(this.nextOccurrenceDate || this.startDate) > new Date(this.endDate)) return false;
    return true;
  }

  getNextOccurrenceDate(fromDate: Date = new Date()): Date | null {
    if (!this.canCreateMoreOccurrences()) return null;

    const currentDate = new Date(this.nextOccurrenceDate || this.startDate);
    
    switch (this.recurrencePattern) {
      case RecurrencePattern.DAILY:
        if (currentDate <= fromDate) {
          currentDate.setDate(fromDate.getDate() + 1);
        }
        break;
      
      case RecurrencePattern.WEEKLY:
        while (currentDate <= fromDate || currentDate.getDay() !== this.dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
      
      case RecurrencePattern.BIWEEKLY:
        while (currentDate <= fromDate) {
          currentDate.setDate(currentDate.getDate() + 14);
        }
        break;
      
      case RecurrencePattern.MONTHLY:
        if (this.dayOfMonth) {
          while (currentDate <= fromDate) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(Math.min(this.dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()));
          }
        }
        break;
    }

    if (this.endDate && currentDate > new Date(this.endDate)) {
      return null;
    }

    return currentDate;
  }
}