import { Request, Response, NextFunction } from 'express';
import { WaitlistService } from '../services/WaitlistService';
import { CreateWaitlistDto, UpdateWaitlistDto } from '../dtos/waitlist.dto';
import { validateDto } from '../middleware/validation';
import { WaitlistStatus } from '../entities/Waitlist';

export class WaitlistController {
  private waitlistService: WaitlistService;

  constructor() {
    this.waitlistService = new WaitlistService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await validateDto(CreateWaitlistDto, req.body);
      const waitlistEntry = await this.waitlistService.create(dto);

      res.status(201).json({
        success: true,
        message: 'Added to waitlist successfully',
        data: waitlistEntry,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const waitlistEntry = await this.waitlistService.findById(id);
      const position = await this.waitlistService.getPosition(id);
      const estimatedWait = await this.waitlistService.getEstimatedWaitTime(id);

      res.json({
        success: true,
        data: {
          ...waitlistEntry,
          position: position > 0 ? position : null,
          estimatedWaitMinutes: estimatedWait,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  findByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const { date, status, page, limit } = req.query;

      const result = await this.waitlistService.findByRestaurant(
        restaurantId,
        date as string | undefined,
        status as WaitlistStatus | undefined,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: result.entries,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: limit ? parseInt(limit as string) : 20,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = await validateDto(UpdateWaitlistDto, req.body);
      const waitlistEntry = await this.waitlistService.update(id, dto);

      res.json({
        success: true,
        message: 'Waitlist entry updated successfully',
        data: waitlistEntry,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const waitlistEntry = await this.waitlistService.cancel(id);

      res.json({
        success: true,
        message: 'Waitlist entry cancelled successfully',
        data: waitlistEntry,
      });
    } catch (error) {
      next(error);
    }
  };

  getPosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const position = await this.waitlistService.getPosition(id);
      const estimatedWait = await this.waitlistService.getEstimatedWaitTime(id);

      res.json({
        success: true,
        data: {
          position: position > 0 ? position : null,
          estimatedWaitMinutes: estimatedWait,
          message:
            position > 0
              ? `You are #${position} on the waitlist`
              : 'You are no longer on the waitlist',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  notifyAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, startTime, endTime } = req.body;

      if (!date || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          message: 'Date, start time, and end time are required',
        });
        return;
      }

      const waitlistEntry = await this.waitlistService.notifyAvailability(id, {
        date,
        startTime,
        endTime,
      });

      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: waitlistEntry,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsExpired = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const waitlistEntry = await this.waitlistService.markAsExpired(id);

      res.json({
        success: true,
        message: 'Waitlist entry marked as expired',
        data: waitlistEntry,
      });
    } catch (error) {
      next(error);
    }
  };
}