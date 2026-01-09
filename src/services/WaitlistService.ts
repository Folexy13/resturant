import { Repository, In, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Waitlist, WaitlistStatus } from '../entities/Waitlist';
import { CreateWaitlistDto, UpdateWaitlistDto } from '../dtos/waitlist.dto';
import { AppError } from '../utils/AppError';
import { RestaurantService } from './RestaurantService';
import { ReservationService } from './ReservationService';
import { NotificationService } from './NotificationService';

export class WaitlistService {
  private waitlistRepository: Repository<Waitlist>;
  private restaurantService: RestaurantService;
  private notificationService: NotificationService;

  constructor() {
    this.waitlistRepository = AppDataSource.getRepository(Waitlist);
    this.restaurantService = new RestaurantService();
    this.notificationService = new NotificationService();
  }

  async create(dto: CreateWaitlistDto): Promise<Waitlist> {
    // Verify restaurant exists
    const restaurant = await this.restaurantService.findById(dto.restaurantId);

    if (!restaurant.isActive) {
      throw new AppError('Restaurant is not currently accepting waitlist entries', 400);
    }

    // Validate time range
    if (!restaurant.isTimeRangeValid(dto.preferredStartTime, dto.preferredEndTime)) {
      throw new AppError(
        `Preferred time must be within operating hours (${restaurant.openingTime} - ${restaurant.closingTime})`,
        400
      );
    }

    const waitlistEntry = this.waitlistRepository.create({
      restaurantId: dto.restaurantId,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      partySize: dto.partySize,
      requestedDate: dto.requestedDate,
      preferredStartTime: dto.preferredStartTime,
      preferredEndTime: dto.preferredEndTime,
      durationMinutes: dto.durationMinutes,
      specialRequests: dto.specialRequests,
      status: WaitlistStatus.WAITING,
    });

    return await this.waitlistRepository.save(waitlistEntry);
  }

  async findById(id: string): Promise<Waitlist> {
    const waitlistEntry = await this.waitlistRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!waitlistEntry) {
      throw new AppError('Waitlist entry not found', 404);
    }

    return waitlistEntry;
  }

  async findByRestaurant(
    restaurantId: string,
    date?: string,
    status?: WaitlistStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ entries: Waitlist[]; total: number; page: number; totalPages: number }> {
    const where: Record<string, unknown> = { restaurantId };

    if (date) {
      where.requestedDate = date;
    }

    if (status) {
      where.status = status;
    }

    const [entries, total] = await this.waitlistRepository.findAndCount({
      where,
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateWaitlistDto): Promise<Waitlist> {
    const waitlistEntry = await this.findById(id);

    if (!waitlistEntry.isValid()) {
      throw new AppError(
        `Waitlist entry cannot be modified in ${waitlistEntry.status} status`,
        400
      );
    }

    Object.assign(waitlistEntry, dto);
    return await this.waitlistRepository.save(waitlistEntry);
  }

  async cancel(id: string): Promise<Waitlist> {
    const waitlistEntry = await this.findById(id);

    if (!waitlistEntry.isValid()) {
      throw new AppError(
        `Waitlist entry cannot be cancelled in ${waitlistEntry.status} status`,
        400
      );
    }

    waitlistEntry.status = WaitlistStatus.CANCELLED;
    return await this.waitlistRepository.save(waitlistEntry);
  }

  async notifyAvailability(
    id: string,
    availableSlot: { date: string; startTime: string; endTime: string }
  ): Promise<Waitlist> {
    const waitlistEntry = await this.findById(id);

    if (!waitlistEntry.canBeNotified()) {
      throw new AppError('Waitlist entry cannot be notified', 400);
    }

    // Send notification
    await this.notificationService.sendWaitlistNotification(waitlistEntry, availableSlot);

    // Update status
    waitlistEntry.status = WaitlistStatus.NOTIFIED;
    waitlistEntry.notificationCount += 1;
    waitlistEntry.lastNotifiedAt = new Date();

    return await this.waitlistRepository.save(waitlistEntry);
  }

  async convertToReservation(id: string, reservationId: string): Promise<Waitlist> {
    const waitlistEntry = await this.findById(id);

    waitlistEntry.status = WaitlistStatus.SEATED;
    waitlistEntry.convertedReservationId = reservationId;

    return await this.waitlistRepository.save(waitlistEntry);
  }

  async markAsExpired(id: string): Promise<Waitlist> {
    const waitlistEntry = await this.findById(id);

    if (waitlistEntry.status !== WaitlistStatus.NOTIFIED) {
      throw new AppError('Only notified entries can be marked as expired', 400);
    }

    waitlistEntry.status = WaitlistStatus.EXPIRED;
    return await this.waitlistRepository.save(waitlistEntry);
  }

  async getWaitingEntriesForSlot(
    restaurantId: string,
    date: string,
    startTime: string,
    endTime: string,
    partySize?: number
  ): Promise<Waitlist[]> {
    const queryBuilder = this.waitlistRepository
      .createQueryBuilder('waitlist')
      .where('waitlist.restaurantId = :restaurantId', { restaurantId })
      .andWhere('waitlist.requestedDate = :date', { date })
      .andWhere('waitlist.status = :status', { status: WaitlistStatus.WAITING })
      .andWhere('waitlist.preferredStartTime <= :startTime', { startTime })
      .andWhere('waitlist.preferredEndTime >= :endTime', { endTime });

    if (partySize) {
      queryBuilder.andWhere('waitlist.partySize <= :partySize', { partySize });
    }

    return await queryBuilder.orderBy('waitlist.createdAt', 'ASC').getMany();
  }

  async processWaitlistForCancellation(
    restaurantId: string,
    date: string,
    startTime: string,
    endTime: string,
    tableCapacity: number
  ): Promise<Waitlist | null> {
    // Find waiting entries that could fit in the cancelled slot
    const waitingEntries = await this.getWaitingEntriesForSlot(
      restaurantId,
      date,
      startTime,
      endTime,
      tableCapacity
    );

    if (waitingEntries.length === 0) {
      return null;
    }

    // Get the first entry (FIFO)
    const entry = waitingEntries[0];

    // Notify them about the available slot
    await this.notifyAvailability(entry.id, { date, startTime, endTime });

    return entry;
  }

  async getPosition(id: string): Promise<number> {
    const waitlistEntry = await this.findById(id);

    if (waitlistEntry.status !== WaitlistStatus.WAITING) {
      return -1;
    }

    const count = await this.waitlistRepository.count({
      where: {
        restaurantId: waitlistEntry.restaurantId,
        requestedDate: waitlistEntry.requestedDate,
        status: WaitlistStatus.WAITING,
        createdAt: LessThan(waitlistEntry.createdAt),
      },
    });

    return count + 1;
  }

  async getEstimatedWaitTime(id: string): Promise<number | null> {
    const position = await this.getPosition(id);

    if (position === -1) {
      return null;
    }

    // Estimate 30 minutes per position (this is a simplified calculation)
    // In production, this would be based on historical data
    return position * 30;
  }
}