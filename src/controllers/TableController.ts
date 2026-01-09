import { Request, Response, NextFunction } from 'express';
import { TableService } from '../services/TableService';
import { CreateTableDto, UpdateTableDto } from '../dtos/table.dto';
import { validateDto } from '../middleware/validation';

export class TableController {
  private tableService: TableService;

  constructor() {
    this.tableService = new TableService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const dto = await validateDto(CreateTableDto, req.body);
      const table = await this.tableService.create(restaurantId, dto);

      res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  };

  findAllByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';
      const tables = await this.tableService.findAllByRestaurant(restaurantId, includeInactive);

      res.json({
        success: true,
        data: tables,
        count: tables.length,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const table = await this.tableService.findById(id);

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = await validateDto(UpdateTableDto, req.body);
      const table = await this.tableService.update(id, dto);

      res.json({
        success: true,
        message: 'Table updated successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.tableService.delete(id);

      res.json({
        success: true,
        message: 'Table deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const table = await this.tableService.deactivate(id);

      res.json({
        success: true,
        message: 'Table deactivated successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const table = await this.tableService.activate(id);

      res.json({
        success: true,
        message: 'Table activated successfully',
        data: table,
      });
    } catch (error) {
      next(error);
    }
  };

  findOptimalTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const partySize = parseInt(req.query.partySize as string);

      if (isNaN(partySize) || partySize < 1) {
        res.status(400).json({
          success: false,
          message: 'Valid party size is required',
        });
        return;
      }

      const table = await this.tableService.findOptimalTable(restaurantId, partySize);

      if (!table) {
        res.status(404).json({
          success: false,
          message: 'No suitable table found for the party size',
          data: {
            alternatives: await this.tableService.suggestAlternativeTables(restaurantId, partySize),
          },
        });
        return;
      }

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  };

  suggestTables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const partySize = parseInt(req.query.partySize as string);
      const limit = parseInt(req.query.limit as string) || 3;

      if (isNaN(partySize) || partySize < 1) {
        res.status(400).json({
          success: false,
          message: 'Valid party size is required',
        });
        return;
      }

      const tables = await this.tableService.suggestAlternativeTables(restaurantId, partySize, limit);

      res.json({
        success: true,
        data: tables,
        count: tables.length,
      });
    } catch (error) {
      next(error);
    }
  };
}