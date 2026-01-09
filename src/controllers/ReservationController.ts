import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/ReservationService';
import { WaitlistService } from '../services/WaitlistService';
import {
  CreateReservationDto,
  UpdateReservationDto,
  CancelReservationDto,
  ConfirmReservationDto,
} from '../dtos/reservation.dto';
import { validateDto } from '../middleware/validation';
import { ReservationStatus } from '../entities/Reservation';

export class ReservationController {
  private reservationService: ReservationService;
  private waitlistService: WaitlistService;

  constructor() {
    this.reservationService = new ReservationService();
    this.waitlistService = new WaitlistService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await validateDto(CreateReservationDto, req.body);
      const reservation = await this.reservationService.create(dto);

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reservation = await this.reservationService.findById(id);

      res.json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  findByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const { date, status, page, limit } = req.query;

      const result = await this.reservationService.findByRestaurant(
        restaurantId,
        date as string | undefined,
        status as ReservationStatus | undefined,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: result.reservations,
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
      const dto = await validateDto(UpdateReservationDto, req.body);
      const reservation = await this.reservationService.update(id, dto);

      res.json({
        success: true,
        message: 'Reservation updated successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = await validateDto(CancelReservationDto, req.body);
      const reservation = await this.reservationService.cancel(id, dto.cancellationReason);

      // Process waitlist for the cancelled slot
      const table = reservation.table;
      if (table) {
        await this.waitlistService.processWaitlistForCancellation(
          reservation.restaurantId,
          reservation.reservationDate,
          reservation.startTime,
          reservation.endTime,
          table.capacity
        );
      }

      res.json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = await validateDto(ConfirmReservationDto, req.body);
      const reservation = await this.reservationService.confirm(id, dto.sendConfirmation ?? true);

      res.json({
        success: true,
        message: 'Reservation confirmed successfully',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsSeated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reservation = await this.reservationService.markAsSeated(id);

      res.json({
        success: true,
        message: 'Reservation marked as seated',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsCompleted = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reservation = await this.reservationService.markAsCompleted(id);

      res.json({
        success: true,
        message: 'Reservation marked as completed',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  markAsNoShow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reservation = await this.reservationService.markAsNoShow(id);

      // Process waitlist for the no-show slot
      const table = reservation.table;
      if (table) {
        await this.waitlistService.processWaitlistForCancellation(
          reservation.restaurantId,
          reservation.reservationDate,
          reservation.startTime,
          reservation.endTime,
          table.capacity
        );
      }

      res.json({
        success: true,
        message: 'Reservation marked as no-show',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  };

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const { date, partySize, durationMinutes } = req.query;

      if (!date || !partySize) {
        res.status(400).json({
          success: false,
          message: 'Date and party size are required',
        });
        return;
      }

      const availability = await this.reservationService.getAvailability(
        restaurantId,
        date as string,
        parseInt(partySize as string),
        durationMinutes ? parseInt(durationMinutes as string) : 90
      );

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  };

  checkTableAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const { date, startTime, partySize, durationMinutes } = req.query;

      if (!date || !startTime || !partySize) {
        res.status(400).json({
          success: false,
          message: 'Date, start time, and party size are required',
        });
        return;
      }

      const availability = await this.reservationService.getAvailability(
        restaurantId,
        date as string,
        parseInt(partySize as string),
        durationMinutes ? parseInt(durationMinutes as string) : 90
      );

      // Filter to find the specific time slot
      const requestedSlot = availability.availableSlots.find(
        (slot) => slot.startTime === startTime
      );

      res.json({
        success: true,
        data: {
          isAvailable: !!requestedSlot,
          slot: requestedSlot || null,
          suggestedTables: availability.suggestedTables,
          alternativeSlots: availability.availableSlots.slice(0, 5),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}