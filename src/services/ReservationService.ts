import { Repository, Between, In, Not, LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { Table } from '../entities/Table';
import { CreateReservationDto, UpdateReservationDto } from '../dtos/reservation.dto';
import { AppError } from '../utils/AppError';
import { RestaurantService } from './RestaurantService';
import { TableService } from './TableService';
import { CacheService } from './CacheService';
import { NotificationService } from './NotificationService';
import { config } from '../config';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  availableTables: Array<{
    id: string;
    tableNumber: number;
    capacity: number;
    location?: string;
  }>;
}

export interface AvailabilityResult {
  date: string;
  partySize: number;
  durationMinutes: number;
  availableSlots: TimeSlot[];
  suggestedTables: Array<{
    id: string;
    tableNumber: number;
    capacity: number;
    location?: string;
    fitScore: number;
  }>;
}

export class ReservationService {
  private reservationRepository: Repository<Reservation>;
  private restaurantService: RestaurantService;
  private tableService: TableService;
  private cacheService: CacheService;
  private notificationService: NotificationService;

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.restaurantService = new RestaurantService();
    this.tableService = new TableService();
    this.cacheService = new CacheService();
    this.notificationService = new NotificationService();
  }

  async create(dto: CreateReservationDto): Promise<Reservation> {
    // Validate restaurant exists and is active
    const restaurant = await this.restaurantService.findById(dto.restaurantId);

    if (!restaurant.isActive) {
      throw new AppError('Restaurant is not currently accepting reservations', 400);
    }

    // Calculate end time
    const endTime = this.calculateEndTime(dto.startTime, dto.durationMinutes);

    // Validate reservation is within operating hours
    if (!restaurant.isTimeRangeValid(dto.startTime, endTime)) {
      throw new AppError(
        `Reservation must be within operating hours (${restaurant.openingTime} - ${restaurant.closingTime})`,
        400
      );
    }

    // Check peak hours restrictions
    const adjustedDuration = this.adjustDurationForPeakHours(dto.startTime, dto.durationMinutes);
    if (adjustedDuration !== dto.durationMinutes) {
      throw new AppError(
        `During peak hours (${config.peakHours.start}:00 - ${config.peakHours.end}:00), maximum reservation duration is ${config.peakHours.maxDuration} minutes`,
        400
      );
    }

    let tableId = dto.tableId;

    // If no table specified, find an optimal one
    if (!tableId) {
      const availableTable = await this.findAvailableTable(
        dto.restaurantId,
        dto.reservationDate,
        dto.startTime,
        endTime,
        dto.partySize
      );

      if (!availableTable) {
        throw new AppError(
          'No tables available for the requested time and party size',
          409,
          true,
          { suggestWaitlist: true }
        );
      }

      tableId = availableTable.id;
    } else {
      // Validate the specified table
      const table = await this.tableService.findById(tableId);

      if (table.restaurantId !== dto.restaurantId) {
        throw new AppError('Table does not belong to this restaurant', 400);
      }

      if (!table.canAccommodate(dto.partySize)) {
        throw new AppError(
          `Table ${table.tableNumber} cannot accommodate party of ${dto.partySize} (capacity: ${table.minCapacity}-${table.capacity})`,
          400
        );
      }

      // Check if table is available
      const isAvailable = await this.isTableAvailable(
        tableId,
        dto.reservationDate,
        dto.startTime,
        endTime
      );

      if (!isAvailable) {
        throw new AppError('Table is not available for the requested time slot', 409);
      }
    }

    // Create the reservation
    const reservation = this.reservationRepository.create({
      restaurantId: dto.restaurantId,
      tableId,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      partySize: dto.partySize,
      reservationDate: dto.reservationDate,
      startTime: dto.startTime,
      endTime,
      durationMinutes: dto.durationMinutes,
      specialRequests: dto.specialRequests,
      status: ReservationStatus.PENDING,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    // Invalidate cache for this date
    await this.cacheService.invalidateAvailability(dto.restaurantId, dto.reservationDate);

    // Send confirmation notification
    await this.notificationService.sendReservationConfirmation(savedReservation);

    return savedReservation;
  }

  async findById(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['table', 'restaurant'],
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    return reservation;
  }

  async findByRestaurant(
    restaurantId: string,
    date?: string,
    status?: ReservationStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reservations: Reservation[]; total: number; page: number; totalPages: number }> {
    const where: Record<string, unknown> = { restaurantId };

    if (date) {
      where.reservationDate = date;
    }

    if (status) {
      where.status = status;
    }

    const [reservations, total] = await this.reservationRepository.findAndCount({
      where,
      relations: ['table'],
      order: { reservationDate: 'ASC', startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reservations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findById(id);

    if (!reservation.canBeModified()) {
      throw new AppError(
        `Reservation cannot be modified in ${reservation.status} status`,
        400
      );
    }

    const restaurant = await this.restaurantService.findById(reservation.restaurantId);

    // Calculate new values
    const startTime = dto.startTime || reservation.startTime;
    const durationMinutes = dto.durationMinutes || reservation.durationMinutes;
    const endTime = this.calculateEndTime(startTime, durationMinutes);
    const reservationDate = dto.reservationDate || reservation.reservationDate;
    const partySize = dto.partySize || reservation.partySize;
    const tableId = dto.tableId || reservation.tableId;

    // Validate operating hours
    if (!restaurant.isTimeRangeValid(startTime, endTime)) {
      throw new AppError(
        `Reservation must be within operating hours (${restaurant.openingTime} - ${restaurant.closingTime})`,
        400
      );
    }

    // Check peak hours
    const adjustedDuration = this.adjustDurationForPeakHours(startTime, durationMinutes);
    if (adjustedDuration !== durationMinutes) {
      throw new AppError(
        `During peak hours, maximum reservation duration is ${config.peakHours.maxDuration} minutes`,
        400
      );
    }

    // If table or time changed, verify availability
    if (
      dto.tableId ||
      dto.startTime ||
      dto.durationMinutes ||
      dto.reservationDate
    ) {
      const table = await this.tableService.findById(tableId);

      if (!table.canAccommodate(partySize)) {
        throw new AppError(
          `Table ${table.tableNumber} cannot accommodate party of ${partySize}`,
          400
        );
      }

      const isAvailable = await this.isTableAvailable(
        tableId,
        reservationDate,
        startTime,
        endTime,
        id // Exclude current reservation from check
      );

      if (!isAvailable) {
        throw new AppError('Table is not available for the requested time slot', 409);
      }
    }

    // Update reservation
    Object.assign(reservation, {
      ...dto,
      startTime,
      endTime,
      durationMinutes,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    // Invalidate cache
    await this.cacheService.invalidateAvailability(reservation.restaurantId, reservationDate);
    if (dto.reservationDate && dto.reservationDate !== reservation.reservationDate) {
      await this.cacheService.invalidateAvailability(reservation.restaurantId, reservation.reservationDate);
    }

    return savedReservation;
  }

  async cancel(id: string, reason?: string): Promise<Reservation> {
    const reservation = await this.findById(id);

    if (!reservation.canBeCancelled()) {
      throw new AppError(
        `Reservation cannot be cancelled in ${reservation.status} status`,
        400
      );
    }

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = reason;

    const savedReservation = await this.reservationRepository.save(reservation);

    // Invalidate cache
    await this.cacheService.invalidateAvailability(
      reservation.restaurantId,
      reservation.reservationDate
    );

    // Send cancellation notification
    await this.notificationService.sendCancellationNotification(savedReservation);

    return savedReservation;
  }

  async confirm(id: string, sendNotification: boolean = true): Promise<Reservation> {
    const reservation = await this.findById(id);

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new AppError('Only pending reservations can be confirmed', 400);
    }

    reservation.status = ReservationStatus.CONFIRMED;
    reservation.confirmedAt = new Date();

    const savedReservation = await this.reservationRepository.save(reservation);

    if (sendNotification) {
      await this.notificationService.sendConfirmationNotification(savedReservation);
    }

    return savedReservation;
  }

  async markAsSeated(id: string): Promise<Reservation> {
    const reservation = await this.findById(id);

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new AppError('Only confirmed reservations can be marked as seated', 400);
    }

    reservation.status = ReservationStatus.SEATED;
    return await this.reservationRepository.save(reservation);
  }

  async markAsCompleted(id: string): Promise<Reservation> {
    const reservation = await this.findById(id);

    if (reservation.status !== ReservationStatus.SEATED) {
      throw new AppError('Only seated reservations can be marked as completed', 400);
    }

    reservation.status = ReservationStatus.COMPLETED;
    return await this.reservationRepository.save(reservation);
  }

  async markAsNoShow(id: string): Promise<Reservation> {
    const reservation = await this.findById(id);

    if (![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(reservation.status)) {
      throw new AppError('Only pending or confirmed reservations can be marked as no-show', 400);
    }

    reservation.status = ReservationStatus.NO_SHOW;
    const savedReservation = await this.reservationRepository.save(reservation);

    // Invalidate cache
    await this.cacheService.invalidateAvailability(
      reservation.restaurantId,
      reservation.reservationDate
    );

    return savedReservation;
  }

  async getAvailability(
    restaurantId: string,
    date: string,
    partySize: number,
    durationMinutes: number = 90
  ): Promise<AvailabilityResult> {
    // Try to get from cache first
    const cached = await this.cacheService.getAvailability(
      restaurantId,
      date,
      partySize,
      durationMinutes
    );

    if (cached) {
      return cached;
    }

    const restaurant = await this.restaurantService.findById(restaurantId);

    // Get all tables that can accommodate the party size
    const suitableTables = await this.tableService.findTablesForPartySize(
      restaurantId,
      partySize
    );

    if (suitableTables.length === 0) {
      return {
        date,
        partySize,
        durationMinutes,
        availableSlots: [],
        suggestedTables: [],
      };
    }

    // Get all reservations for the date
    const reservations = await this.reservationRepository.find({
      where: {
        restaurantId,
        reservationDate: date,
        status: In([
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.SEATED,
        ]),
      },
    });

    // Generate time slots
    const slots = this.generateTimeSlots(
      restaurant.openingTime,
      restaurant.closingTime,
      durationMinutes,
      30 // 30-minute intervals
    );

    const availableSlots: TimeSlot[] = [];

    for (const slot of slots) {
      const availableTables: TimeSlot['availableTables'] = [];

      for (const table of suitableTables) {
        const isAvailable = !reservations.some(
          (r) =>
            r.tableId === table.id &&
            this.timeRangesOverlap(r.startTime, r.endTime, slot.startTime, slot.endTime)
        );

        if (isAvailable) {
          availableTables.push({
            id: table.id,
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            location: table.location,
          });
        }
      }

      if (availableTables.length > 0) {
        availableSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          availableTables,
        });
      }
    }

    // Get suggested tables (best fit for party size)
    const suggestedTables = suitableTables.slice(0, 3).map((table) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      fitScore: table.getFitScore(partySize),
    }));

    const result: AvailabilityResult = {
      date,
      partySize,
      durationMinutes,
      availableSlots,
      suggestedTables,
    };

    // Cache the result
    await this.cacheService.setAvailability(
      restaurantId,
      date,
      partySize,
      durationMinutes,
      result
    );

    return result;
  }

  private async isTableAvailable(
    tableId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    const queryBuilder = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.tableId = :tableId', { tableId })
      .andWhere('reservation.reservationDate = :date', { date })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.SEATED,
        ],
      });

    if (excludeReservationId) {
      queryBuilder.andWhere('reservation.id != :excludeId', {
        excludeId: excludeReservationId,
      });
    }

    const reservations = await queryBuilder.getMany();

    // Check for overlapping reservations
    return !reservations.some((r) =>
      this.timeRangesOverlap(r.startTime, r.endTime, startTime, endTime)
    );
  }

  private async findAvailableTable(
    restaurantId: string,
    date: string,
    startTime: string,
    endTime: string,
    partySize: number
  ): Promise<Table | null> {
    const suitableTables = await this.tableService.findTablesForPartySize(
      restaurantId,
      partySize
    );

    for (const table of suitableTables) {
      const isAvailable = await this.isTableAvailable(table.id, date, startTime, endTime);
      if (isAvailable) {
        return table;
      }
    }

    return null;
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  private timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  private adjustDurationForPeakHours(startTime: string, durationMinutes: number): number {
    const [hours] = startTime.split(':').map(Number);

    if (hours >= config.peakHours.start && hours < config.peakHours.end) {
      return Math.min(durationMinutes, config.peakHours.maxDuration);
    }

    return durationMinutes;
  }

  private generateTimeSlots(
    openingTime: string,
    closingTime: string,
    durationMinutes: number,
    intervalMinutes: number
  ): Array<{ startTime: string; endTime: string }> {
    const slots: Array<{ startTime: string; endTime: string }> = [];

    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const toTimeString = (minutes: number): string => {
      const h = Math.floor(minutes / 60) % 24;
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    let openingMinutes = toMinutes(openingTime);
    const closingMinutes = toMinutes(closingTime);

    // Handle closing time after midnight
    const adjustedClosing =
      closingMinutes < openingMinutes ? closingMinutes + 24 * 60 : closingMinutes;

    while (openingMinutes + durationMinutes <= adjustedClosing) {
      const endMinutes = openingMinutes + durationMinutes;
      slots.push({
        startTime: toTimeString(openingMinutes),
        endTime: toTimeString(endMinutes),
      });
      openingMinutes += intervalMinutes;
    }

    return slots;
  }
}