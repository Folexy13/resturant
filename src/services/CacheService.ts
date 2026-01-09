import { redis } from '../config/redis';
import { config } from '../config';
import { AvailabilityResult } from './ReservationService';

export class CacheService {
  private readonly prefix = 'restaurant:';
  private readonly ttl = config.cache.ttl;

  private getAvailabilityKey(
    restaurantId: string,
    date: string,
    partySize: number,
    durationMinutes: number
  ): string {
    return `${this.prefix}availability:${restaurantId}:${date}:${partySize}:${durationMinutes}`;
  }

  async getAvailability(
    restaurantId: string,
    date: string,
    partySize: number,
    durationMinutes: number
  ): Promise<AvailabilityResult | null> {
    try {
      const key = this.getAvailabilityKey(restaurantId, date, partySize, durationMinutes);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as AvailabilityResult;
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setAvailability(
    restaurantId: string,
    date: string,
    partySize: number,
    durationMinutes: number,
    data: AvailabilityResult
  ): Promise<void> {
    try {
      const key = this.getAvailabilityKey(restaurantId, date, partySize, durationMinutes);
      await redis.setex(key, this.ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidateAvailability(restaurantId: string, date: string): Promise<void> {
    try {
      const pattern = `${this.prefix}availability:${restaurantId}:${date}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async invalidateRestaurant(restaurantId: string): Promise<void> {
    try {
      const pattern = `${this.prefix}*:${restaurantId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(`${this.prefix}${key}`);
      if (cached) {
        return JSON.parse(cached) as T;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      await redis.setex(`${this.prefix}${key}`, ttl || this.ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(`${this.prefix}${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}