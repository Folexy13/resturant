import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Reservation } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'restaurant_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Restaurant, Table, Reservation, Waitlist],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
    return AppDataSource;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};