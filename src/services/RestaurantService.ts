import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Restaurant } from '../entities/Restaurant';
import { CreateRestaurantDto, UpdateRestaurantDto } from '../dtos/restaurant.dto';
import { AppError } from '../utils/AppError';

export class RestaurantService {
  private restaurantRepository: Repository<Restaurant>;

  constructor() {
    this.restaurantRepository = AppDataSource.getRepository(Restaurant);
  }

  async create(dto: CreateRestaurantDto): Promise<Restaurant> {
    // Validate opening and closing times
    if (!this.isValidTimeRange(dto.openingTime, dto.closingTime)) {
      throw new AppError('Invalid operating hours', 400);
    }

    const restaurant = this.restaurantRepository.create({
      name: dto.name,
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
      address: dto.address,
      phone: dto.phone,
      totalTables: 0,
    });

    return await this.restaurantRepository.save(restaurant);
  }

  async findAll(includeInactive = false): Promise<Restaurant[]> {
    const where = includeInactive ? {} : { isActive: true };
    return await this.restaurantRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['tables'],
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return restaurant;
  }

  async findByIdWithAvailableTables(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id, isActive: true },
      relations: ['tables'],
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Filter to only active tables
    restaurant.tables = restaurant.tables.filter((table) => table.isActive);

    return restaurant;
  }

  async update(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findById(id);

    // Validate time range if both times are provided
    const openingTime = dto.openingTime || restaurant.openingTime;
    const closingTime = dto.closingTime || restaurant.closingTime;

    if (!this.isValidTimeRange(openingTime, closingTime)) {
      throw new AppError('Invalid operating hours', 400);
    }

    Object.assign(restaurant, dto);
    return await this.restaurantRepository.save(restaurant);
  }

  async delete(id: string): Promise<void> {
    const restaurant = await this.findById(id);
    await this.restaurantRepository.remove(restaurant);
  }

  async deactivate(id: string): Promise<Restaurant> {
    const restaurant = await this.findById(id);
    restaurant.isActive = false;
    return await this.restaurantRepository.save(restaurant);
  }

  async activate(id: string): Promise<Restaurant> {
    const restaurant = await this.findById(id);
    restaurant.isActive = true;
    return await this.restaurantRepository.save(restaurant);
  }

  async updateTableCount(id: string): Promise<void> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['tables'],
    });

    if (restaurant) {
      restaurant.totalTables = restaurant.tables.filter((t) => t.isActive).length;
      await this.restaurantRepository.save(restaurant);
    }
  }

  private isValidTimeRange(openingTime: string, closingTime: string): boolean {
    // Basic validation - times should be in HH:MM format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
      return false;
    }

    // Allow closing time to be after midnight (e.g., 02:00 for late-night restaurants)
    // In this case, closing time will be less than opening time
    return true;
  }

  async getOperatingHours(id: string): Promise<{ openingTime: string; closingTime: string }> {
    const restaurant = await this.findById(id);
    return {
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
    };
  }
}