import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { RecurringReservation, RecurrencePattern, RecurringReservationStatus } from '../entities/RecurringReservation';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { AppDataSource } from '../config/database';
import { AppError } from '../utils/AppError';
import { ReservationService } from './ReservationService';
import { timezoneService } from './TimezoneService';

interface CreateRecurringReservationDto {
  restaurantId: string;
  tableId?: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  recurrencePattern: RecurrencePattern;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startTime: string;
  durationMinutes: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  specialRequests?: string;
}

export class RecurringReservationService {
  private recurringRepository: Repository<RecurringReservation>;
  private reservationRepository: Repository<Reservation>;
  private restaurantRepository: Repository<Restaurant>;
  private tableRepository: Repository<Table>;
  private reservationService: ReservationService;

  constructor() {
    this.recurringRepository = AppDataSource.getRepository(RecurringReservation);
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.restaurantRepository = AppDataSource.getRepository(Restaurant);
    this.tableRepository = AppDataSource.getRepository(Table);
    this.reservationService = new ReservationService();
  }

  async create(data: CreateRecurringReservationDto): Promise<RecurringReservation> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Validate table if provided
    if (data.tableId) {
      const table = await this.tableRepository.findOne({
        where: { id: data.tableId, restaurantId: data.restaurantId },
      });

      if (!table) {
        throw new AppError('Table not found', 404);
      }

      if (table.capacity < data.partySize) {
        throw new AppError('Table capacity is insufficient for party size', 400);
      }
    }

    // Validate recurrence pattern requirements
    if (data.recurrencePattern === RecurrencePattern.WEEKLY || 
        data.recurrencePattern === RecurrencePattern.BIWEEKLY) {
      if (data.dayOfWeek === undefined || data.dayOfWeek < 0 || data.dayOfWeek > 6) {
        throw new AppError('Day of week (0-6) is required for weekly/biweekly patterns', 400);
      }
    }

    if (data.recurrencePattern === RecurrencePattern.MONTHLY) {
      if (!data.dayOfMonth || data.dayOfMonth < 1 || data.dayOfMonth > 31) {
        throw new AppError('Day of month (1-31) is required for monthly patterns', 400);
      }
    }

    // Validate time is within operating hours
    const endTime = timezoneService.addMinutes(data.startTime, data.durationMinutes);
    if (!restaurant.isTimeRangeValid(data.startTime, endTime)) {
      throw new AppError('Reservation time is outside restaurant operating hours', 400);
    }

    // Create recurring reservation
    const recurring = this.recurringRepository.create({
      ...data,
      nextOccurrenceDate: data.startDate,
      status: RecurringReservationStatus.ACTIVE,
    });

    await this.recurringRepository.save(recurring);

    // Create first occurrence
    await this.createNextOccurrence(recurring);

    return recurring;
  }

  async createNextOccurrence(recurring: RecurringReservation): Promise<Reservation | null> {
    if (!recurring.canCreateMoreOccurrences()) {
      return null;
    }

    const nextDate = recurring.getNextOccurrenceDate();
    if (!nextDate) {
      return null;
    }

    const dateStr = nextDate.toISOString().split('T')[0];
    const endTime = recurring.calculateEndTime();

    try {
      // Try to create the reservation
      const reservation = await this.reservationService.create({
        restaurantId: recurring.restaurantId,
        tableId: recurring.tableId,
        customerName: recurring.customerName,
        customerPhone: recurring.customerPhone,
        customerEmail: recurring.customerEmail,
        partySize: recurring.partySize,
        reservationDate: dateStr,
        startTime: recurring.startTime,
        durationMinutes: recurring.durationMinutes,
        specialRequests: recurring.specialRequests,
      });

      // Update recurring reservation
      recurring.occurrencesCreated++;
      recurring.lastOccurrenceDate = dateStr;
      recurring.nextOccurrenceDate = this.calculateNextDate(recurring, nextDate);

      // Link reservation to recurring
      reservation.recurringReservationId = recurring.id;
      await this.reservationRepository.save(reservation);
      await this.recurringRepository.save(recurring);

      // Check if we've reached the limit
      if (recurring.maxOccurrences && recurring.occurrencesCreated >= recurring.maxOccurrences) {
        recurring.status = RecurringReservationStatus.COMPLETED;
        await this.recurringRepository.save(recurring);
      }

      return reservation;
    } catch (error) {
      // If reservation fails (e.g., table not available), skip this occurrence
      console.error(`Failed to create occurrence for recurring ${recurring.id}:`, error);
      
      // Move to next occurrence date
      recurring.nextOccurrenceDate = this.calculateNextDate(recurring, nextDate);
      await this.recurringRepository.save(recurring);
      
      return null;
    }
  }

  private calculateNextDate(recurring: RecurringReservation, currentDate: Date): string | undefined {
    const next = new Date(currentDate);

    switch (recurring.recurrencePattern) {
      case RecurrencePattern.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurrencePattern.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrencePattern.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurrencePattern.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        if (recurring.dayOfMonth) {
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(recurring.dayOfMonth, lastDay));
        }
        break;
    }

    if (recurring.endDate && next > new Date(recurring.endDate)) {
      return undefined;
    }

    return next.toISOString().split('T')[0];
  }

  async findById(id: string): Promise<RecurringReservation> {
    const recurring = await this.recurringRepository.findOne({
      where: { id },
      relations: ['restaurant', 'table', 'reservations'],
    });

    if (!recurring) {
      throw new AppError('Recurring reservation not found', 404);
    }

    return recurring;
  }

  async findByRestaurant(
    restaurantId: string,
    status?: RecurringReservationStatus
  ): Promise<RecurringReservation[]> {
    const where: Record<string, unknown> = { restaurantId };
    if (status) {
      where.status = status;
    }

    return this.recurringRepository.find({
      where,
      relations: ['table'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<RecurringReservation[]> {
    return this.recurringRepository.find({
      where: { userId },
      relations: ['restaurant', 'table'],
      order: { createdAt: 'DESC' },
    });
  }

  async pause(id: string): Promise<RecurringReservation> {
    const recurring = await this.findById(id);

    if (recurring.status !== RecurringReservationStatus.ACTIVE) {
      throw new AppError('Only active recurring reservations can be paused', 400);
    }

    recurring.status = RecurringReservationStatus.PAUSED;
    return this.recurringRepository.save(recurring);
  }

  async resume(id: string): Promise<RecurringReservation> {
    const recurring = await this.findById(id);

    if (recurring.status !== RecurringReservationStatus.PAUSED) {
      throw new AppError('Only paused recurring reservations can be resumed', 400);
    }

    recurring.status = RecurringReservationStatus.ACTIVE;
    
    // Recalculate next occurrence date
    const nextDate = recurring.getNextOccurrenceDate(new Date());
    if (nextDate) {
      recurring.nextOccurrenceDate = nextDate.toISOString().split('T')[0];
    }

    return this.recurringRepository.save(recurring);
  }

  async cancel(id: string, cancelFutureReservations: boolean = true): Promise<RecurringReservation> {
    const recurring = await this.findById(id);

    if (recurring.status === RecurringReservationStatus.CANCELLED) {
      throw new AppError('Recurring reservation is already cancelled', 400);
    }

    recurring.status = RecurringReservationStatus.CANCELLED;
    await this.recurringRepository.save(recurring);

    // Optionally cancel all future reservations
    if (cancelFutureReservations) {
      const today = new Date().toISOString().split('T')[0];
      await this.reservationRepository.update(
        {
          recurringReservationId: id,
          reservationDate: MoreThanOrEqual(today),
          status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        },
        {
          status: ReservationStatus.CANCELLED,
          cancellationReason: 'Recurring reservation cancelled',
          cancelledAt: new Date(),
        }
      );
    }

    return recurring;
  }

  async update(id: string, data: Partial<CreateRecurringReservationDto>): Promise<RecurringReservation> {
    const recurring = await this.findById(id);

    if (recurring.status === RecurringReservationStatus.CANCELLED) {
      throw new AppError('Cannot update cancelled recurring reservation', 400);
    }

    // Update allowed fields
    if (data.customerName) recurring.customerName = data.customerName;
    if (data.customerPhone) recurring.customerPhone = data.customerPhone;
    if (data.customerEmail !== undefined) recurring.customerEmail = data.customerEmail;
    if (data.partySize) recurring.partySize = data.partySize;
    if (data.startTime) recurring.startTime = data.startTime;
    if (data.durationMinutes) recurring.durationMinutes = data.durationMinutes;
    if (data.specialRequests !== undefined) recurring.specialRequests = data.specialRequests;
    if (data.endDate !== undefined) recurring.endDate = data.endDate;
    if (data.maxOccurrences !== undefined) recurring.maxOccurrences = data.maxOccurrences;

    return this.recurringRepository.save(recurring);
  }

  async getUpcomingOccurrences(id: string, limit: number = 10): Promise<Reservation[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.reservationRepository.find({
      where: {
        recurringReservationId: id,
        reservationDate: MoreThanOrEqual(today),
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
      },
      order: { reservationDate: 'ASC', startTime: 'ASC' },
      take: limit,
    });
  }

  async processScheduledOccurrences(): Promise<number> {
    // Find all active recurring reservations that need new occurrences
    const today = new Date().toISOString().split('T')[0];
    const lookAhead = new Date();
    lookAhead.setDate(lookAhead.getDate() + 30); // Create occurrences 30 days ahead
    const lookAheadStr = lookAhead.toISOString().split('T')[0];

    const activeRecurring = await this.recurringRepository.find({
      where: {
        status: RecurringReservationStatus.ACTIVE,
        nextOccurrenceDate: LessThanOrEqual(lookAheadStr),
      },
    });

    let created = 0;

    for (const recurring of activeRecurring) {
      // Create occurrences up to 30 days ahead
      while (
        recurring.nextOccurrenceDate &&
        recurring.nextOccurrenceDate <= lookAheadStr &&
        recurring.canCreateMoreOccurrences()
      ) {
        const reservation = await this.createNextOccurrence(recurring);
        if (reservation) {
          created++;
        }
      }
    }

    return created;
  }
}