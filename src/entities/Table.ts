import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Restaurant } from './Restaurant';
import { Reservation } from './Reservation';

@Entity('tables')
@Unique(['restaurantId', 'tableNumber'])
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId!: string;

  @Column({ type: 'int', name: 'table_number' })
  tableNumber!: number;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  location?: string; // e.g., 'window', 'patio', 'main floor'

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'int', name: 'min_capacity', default: 1 })
  minCapacity!: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @OneToMany(() => Reservation, (reservation) => reservation.table)
  reservations!: Reservation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Check if table can accommodate party size
  canAccommodate(partySize: number): boolean {
    return partySize >= this.minCapacity && partySize <= this.capacity;
  }

  // Calculate how well the table fits the party (lower is better)
  getFitScore(partySize: number): number {
    if (!this.canAccommodate(partySize)) {
      return Infinity;
    }
    return this.capacity - partySize;
  }
}