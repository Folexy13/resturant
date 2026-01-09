import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Table } from '../entities/Table';
import { Restaurant } from '../entities/Restaurant';
import { CreateTableDto, UpdateTableDto } from '../dtos/table.dto';
import { AppError } from '../utils/AppError';
import { RestaurantService } from './RestaurantService';

export class TableService {
  private tableRepository: Repository<Table>;
  private restaurantService: RestaurantService;

  constructor() {
    this.tableRepository = AppDataSource.getRepository(Table);
    this.restaurantService = new RestaurantService();
  }

  async create(restaurantId: string, dto: CreateTableDto): Promise<Table> {
    // Verify restaurant exists
    const restaurant = await this.restaurantService.findById(restaurantId);

    // Check if table number already exists for this restaurant
    const existingTable = await this.tableRepository.findOne({
      where: { restaurantId, tableNumber: dto.tableNumber },
    });

    if (existingTable) {
      throw new AppError(`Table number ${dto.tableNumber} already exists in this restaurant`, 409);
    }

    // Validate min capacity
    const minCapacity = dto.minCapacity || 1;
    if (minCapacity > dto.capacity) {
      throw new AppError('Minimum capacity cannot exceed maximum capacity', 400);
    }

    const table = this.tableRepository.create({
      restaurantId,
      tableNumber: dto.tableNumber,
      capacity: dto.capacity,
      minCapacity,
      location: dto.location,
    });

    const savedTable = await this.tableRepository.save(table);

    // Update restaurant table count
    await this.restaurantService.updateTableCount(restaurantId);

    return savedTable;
  }

  async findAllByRestaurant(restaurantId: string, includeInactive = false): Promise<Table[]> {
    // Verify restaurant exists
    await this.restaurantService.findById(restaurantId);

    const where: Record<string, unknown> = { restaurantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.tableRepository.find({
      where,
      order: { tableNumber: 'ASC' },
    });
  }

  async findById(id: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    return table;
  }

  async findByRestaurantAndNumber(restaurantId: string, tableNumber: number): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { restaurantId, tableNumber },
    });

    if (!table) {
      throw new AppError(`Table ${tableNumber} not found in this restaurant`, 404);
    }

    return table;
  }

  async update(id: string, dto: UpdateTableDto): Promise<Table> {
    const table = await this.findById(id);

    // If updating table number, check for conflicts
    if (dto.tableNumber && dto.tableNumber !== table.tableNumber) {
      const existingTable = await this.tableRepository.findOne({
        where: { restaurantId: table.restaurantId, tableNumber: dto.tableNumber },
      });

      if (existingTable) {
        throw new AppError(`Table number ${dto.tableNumber} already exists in this restaurant`, 409);
      }
    }

    // Validate capacity constraints
    const capacity = dto.capacity ?? table.capacity;
    const minCapacity = dto.minCapacity ?? table.minCapacity;

    if (minCapacity > capacity) {
      throw new AppError('Minimum capacity cannot exceed maximum capacity', 400);
    }

    Object.assign(table, dto);
    const savedTable = await this.tableRepository.save(table);

    // Update restaurant table count if active status changed
    if (dto.isActive !== undefined) {
      await this.restaurantService.updateTableCount(table.restaurantId);
    }

    return savedTable;
  }

  async delete(id: string): Promise<void> {
    const table = await this.findById(id);
    const restaurantId = table.restaurantId;

    await this.tableRepository.remove(table);

    // Update restaurant table count
    await this.restaurantService.updateTableCount(restaurantId);
  }

  async deactivate(id: string): Promise<Table> {
    const table = await this.findById(id);
    table.isActive = false;
    const savedTable = await this.tableRepository.save(table);

    await this.restaurantService.updateTableCount(table.restaurantId);

    return savedTable;
  }

  async activate(id: string): Promise<Table> {
    const table = await this.findById(id);
    table.isActive = true;
    const savedTable = await this.tableRepository.save(table);

    await this.restaurantService.updateTableCount(table.restaurantId);

    return savedTable;
  }

  async findTablesForPartySize(restaurantId: string, partySize: number): Promise<Table[]> {
    return await this.tableRepository
      .createQueryBuilder('table')
      .where('table.restaurantId = :restaurantId', { restaurantId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .andWhere('table.capacity >= :partySize', { partySize })
      .andWhere('table.minCapacity <= :partySize', { partySize })
      .orderBy('table.capacity', 'ASC') // Prefer smaller tables that fit
      .getMany();
  }

  async findOptimalTable(restaurantId: string, partySize: number): Promise<Table | null> {
    // Find the table with the smallest capacity that can accommodate the party
    const tables = await this.findTablesForPartySize(restaurantId, partySize);

    if (tables.length === 0) {
      return null;
    }

    // Return the table with the best fit (smallest capacity that fits)
    return tables[0];
  }

  async suggestAlternativeTables(
    restaurantId: string,
    partySize: number,
    limit: number = 3
  ): Promise<Table[]> {
    // Find tables that are close to the party size
    return await this.tableRepository
      .createQueryBuilder('table')
      .where('table.restaurantId = :restaurantId', { restaurantId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .andWhere('table.capacity >= :minSize', { minSize: Math.max(1, partySize - 2) })
      .orderBy('ABS(table.capacity - :partySize)', 'ASC')
      .setParameter('partySize', partySize)
      .limit(limit)
      .getMany();
  }
}