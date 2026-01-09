import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Table } from './Table';
import { Reservation } from './Reservation';
import { Waitlist } from './Waitlist';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'time', name: 'opening_time' })
  openingTime!: string;

  @Column({ type: 'time', name: 'closing_time' })
  closingTime!: string;

  @Column({ type: 'int', name: 'total_tables', default: 0 })
  totalTables!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @OneToMany(() => Table, (table) => table.restaurant, { cascade: true })
  tables!: Table[];

  @OneToMany(() => Reservation, (reservation) => reservation.restaurant)
  reservations!: Reservation[];

  @OneToMany(() => Waitlist, (waitlist) => waitlist.restaurant)
  waitlistEntries!: Waitlist[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper method to check if restaurant is open at a given time
  isOpenAt(time: string): boolean {
    const timeValue = this.timeToMinutes(time);
    const openingValue = this.timeToMinutes(this.openingTime);
    const closingValue = this.timeToMinutes(this.closingTime);

    // Handle case where closing time is after midnight
    if (closingValue < openingValue) {
      return timeValue >= openingValue || timeValue < closingValue;
    }

    return timeValue >= openingValue && timeValue < closingValue;
  }

  // Helper method to check if a time range is within operating hours
  isTimeRangeValid(startTime: string, endTime: string): boolean {
    const startValue = this.timeToMinutes(startTime);
    const endValue = this.timeToMinutes(endTime);
    const openingValue = this.timeToMinutes(this.openingTime);
    const closingValue = this.timeToMinutes(this.closingTime);

    // Handle case where closing time is after midnight
    if (closingValue < openingValue) {
      const startValid = startValue >= openingValue || startValue < closingValue;
      const endValid = endValue >= openingValue || endValue <= closingValue;
      return startValid && endValid;
    }

    return startValue >= openingValue && endValue <= closingValue;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}