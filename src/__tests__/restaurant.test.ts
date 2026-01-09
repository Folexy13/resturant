import request from 'supertest';
import { Application } from 'express';
import { DataSource } from 'typeorm';
import { createApp } from '../app';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Reservation } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';

describe('Restaurant API', () => {
  let app: Application;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      database: 'restaurant_db_test',
      synchronize: true,
      dropSchema: true,
      entities: [Restaurant, Table, Reservation, Waitlist],
      logging: false,
    });

    await dataSource.initialize();
    app = createApp();
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.getRepository(Reservation).clear();
    await dataSource.getRepository(Waitlist).clear();
    await dataSource.getRepository(Table).clear();
    await dataSource.getRepository(Restaurant).clear();
  });

  describe('POST /api/v1/restaurants', () => {
    it('should create a restaurant successfully', async () => {
      const restaurantData = {
        name: 'Test Restaurant',
        openingTime: '10:00',
        closingTime: '22:00',
        address: '123 Main St',
        phone: '555-1234',
      };

      const response = await request(app)
        .post('/api/v1/restaurants')
        .send(restaurantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Restaurant');
      expect(response.body.data.openingTime).toBe('10:00');
      expect(response.body.data.closingTime).toBe('22:00');
    });

    it('should fail with invalid time format', async () => {
      const restaurantData = {
        name: 'Test Restaurant',
        openingTime: '25:00', // Invalid hour
        closingTime: '22:00',
      };

      const response = await request(app)
        .post('/api/v1/restaurants')
        .send(restaurantData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/restaurants', () => {
    it('should return all restaurants', async () => {
      // Create test restaurants
      const restaurantRepo = dataSource.getRepository(Restaurant);
      await restaurantRepo.save([
        { name: 'Restaurant 1', openingTime: '10:00', closingTime: '22:00' },
        { name: 'Restaurant 2', openingTime: '11:00', closingTime: '23:00' },
      ]);

      const response = await request(app)
        .get('/api/v1/restaurants')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/restaurants/:id', () => {
    it('should return a restaurant with tables', async () => {
      const restaurantRepo = dataSource.getRepository(Restaurant);
      const tableRepo = dataSource.getRepository(Table);

      const restaurant = await restaurantRepo.save({
        name: 'Test Restaurant',
        openingTime: '10:00',
        closingTime: '22:00',
      });

      await tableRepo.save([
        { restaurantId: restaurant.id, tableNumber: 1, capacity: 4 },
        { restaurantId: restaurant.id, tableNumber: 2, capacity: 6 },
      ]);

      const response = await request(app)
        .get(`/api/v1/restaurants/${restaurant.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Restaurant');
      expect(response.body.data.tables.length).toBe(2);
    });

    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});