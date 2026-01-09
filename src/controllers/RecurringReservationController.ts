import { Request, Response, NextFunction } from 'express';
import { RecurringReservationService } from '../services/RecurringReservationService';
import { RecurrencePattern, RecurringReservationStatus } from '../entities/RecurringReservation';
import { AppError } from '../utils/AppError';

export class RecurringReservationController {
  private recurringService: RecurringReservationService;

  constructor() {
    this.recurringService = new RecurringReservationService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        restaurantId,
        tableId,
        customerName,
        customerPhone,
        customerEmail,
        partySize,
        recurrencePattern,
        dayOfWeek,
        dayOfMonth,
        startTime,
        durationMinutes,
        startDate,
        endDate,
        maxOccurrences,
        specialRequests,
      } = req.body;

      // Validate required fields
      if (!restaurantId || !customerName || !customerPhone || !partySize || 
          !recurrencePattern || !startTime || !durationMinutes || !startDate) {
        throw new AppError('Missing required fields', 400);
      }

      // Validate recurrence pattern
      if (!Object.values(RecurrencePattern).includes(recurrencePattern)) {
        throw new AppError('Invalid recurrence pattern', 400);
      }

      const recurring = await this.recurringService.create({
        restaurantId,
        tableId,
        userId: req.user?.userId,
        customerName,
        customerPhone,
        customerEmail,
        partySize,
        recurrencePattern,
        dayOfWeek,
        dayOfMonth,
        startTime,
        durationMinutes,
        startDate,
        endDate,
        maxOccurrences,
        specialRequests,
      });

      res.status(201).json({
        success: true,
        message: 'Recurring reservation created successfully',
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const recurring = await this.recurringService.findById(id);

      res.json({
        success: true,
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  findByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const status = req.query.status as RecurringReservationStatus | undefined;

      const recurring = await this.recurringService.findByRestaurant(restaurantId, status);

      res.json({
        success: true,
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  findByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const recurring = await this.recurringService.findByUser(req.user.userId);

      res.json({
        success: true,
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        customerName,
        customerPhone,
        customerEmail,
        partySize,
        startTime,
        durationMinutes,
        specialRequests,
        endDate,
        maxOccurrences,
      } = req.body;

      const recurring = await this.recurringService.update(id, {
        customerName,
        customerPhone,
        customerEmail,
        partySize,
        startTime,
        durationMinutes,
        specialRequests,
        endDate,
        maxOccurrences,
      });

      res.json({
        success: true,
        message: 'Recurring reservation updated successfully',
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  pause = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const recurring = await this.recurringService.pause(id);

      res.json({
        success: true,
        message: 'Recurring reservation paused successfully',
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  resume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const recurring = await this.recurringService.resume(id);

      res.json({
        success: true,
        message: 'Recurring reservation resumed successfully',
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { cancelFutureReservations } = req.body;

      const recurring = await this.recurringService.cancel(
        id,
        cancelFutureReservations !== false
      );

      res.json({
        success: true,
        message: 'Recurring reservation cancelled successfully',
        data: recurring,
      });
    } catch (error) {
      next(error);
    }
  };

  getUpcomingOccurrences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const occurrences = await this.recurringService.getUpcomingOccurrences(id, limit);

      res.json({
        success: true,
        data: occurrences,
      });
    } catch (error) {
      next(error);
    }
  };

  processScheduled = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.recurringService.processScheduledOccurrences();

      res.json({
        success: true,
        message: `Processed scheduled occurrences`,
        data: { created },
      });
    } catch (error) {
      next(error);
    }
  };
}