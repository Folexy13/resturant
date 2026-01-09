import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/RestaurantService';
import { CreateRestaurantDto, UpdateRestaurantDto } from '../dtos/restaurant.dto';
import { validateDto } from '../middleware/validation';

export class RestaurantController {
  private restaurantService: RestaurantService;

  constructor() {
    this.restaurantService = new RestaurantService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await validateDto(CreateRestaurantDto, req.body);
      const restaurant = await this.restaurantService.create(dto);

      res.status(201).json({
        success: true,
        message: 'Restaurant created successfully',
        data: restaurant,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const restaurants = await this.restaurantService.findAll(includeInactive);

      res.json({
        success: true,
        data: restaurants,
        count: restaurants.length,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantService.findByIdWithAvailableTables(id);

      res.json({
        success: true,
        data: restaurant,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = await validateDto(UpdateRestaurantDto, req.body);
      const restaurant = await this.restaurantService.update(id, dto);

      res.json({
        success: true,
        message: 'Restaurant updated successfully',
        data: restaurant,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.restaurantService.delete(id);

      res.json({
        success: true,
        message: 'Restaurant deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantService.deactivate(id);

      res.json({
        success: true,
        message: 'Restaurant deactivated successfully',
        data: restaurant,
      });
    } catch (error) {
      next(error);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantService.activate(id);

      res.json({
        success: true,
        message: 'Restaurant activated successfully',
        data: restaurant,
      });
    } catch (error) {
      next(error);
    }
  };

  getOperatingHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const hours = await this.restaurantService.getOperatingHours(id);

      res.json({
        success: true,
        data: hours,
      });
    } catch (error) {
      next(error);
    }
  };
}