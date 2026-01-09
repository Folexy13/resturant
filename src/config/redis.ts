import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times: number) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
      });

      RedisClient.instance.on('connect', () => {
        console.log('Redis connection established successfully');
      });

      RedisClient.instance.on('error', (error: Error) => {
        console.error('Redis connection error:', error);
      });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      console.log('Redis connection closed');
    }
  }
}

export const redis = RedisClient.getInstance();