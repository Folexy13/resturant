import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';
import { User } from '../entities/User';
import { RecurringReservation } from '../entities/RecurringReservation';

// Mock Redis before importing app
jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
  },
  RedisClient: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue('OK'),
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Test database configuration - uses the postgres-test container on port 5433
let testDataSource: DataSource;

// Mock the AppDataSource
jest.mock('../config/database', () => {
  const actualDataSource = new (require('typeorm').DataSource)({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'postgres123',
    database: 'restaurant_db_test',
    synchronize: true,
    dropSchema: true,
    entities: [
      require('../entities/Restaurant').Restaurant,
      require('../entities/Table').Table,
      require('../entities/Reservation').Reservation,
      require('../entities/Waitlist').Waitlist,
      require('../entities/User').User,
      require('../entities/RecurringReservation').RecurringReservation,
    ],
    logging: false,
  });

  return {
    AppDataSource: actualDataSource,
    initializeDatabase: jest.fn().mockImplementation(async () => {
      if (!actualDataSource.isInitialized) {
        await actualDataSource.initialize();
      }
      return actualDataSource;
    }),
  };
});

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../app';
import { AppDataSource } from '../config/database';

describe('Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    testDataSource = AppDataSource;
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
    app = createApp();
  });

  afterAll(async () => {
    if (testDataSource && testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clear all tables before each test in reverse order of dependencies
    if (testDataSource && testDataSource.isInitialized) {
      await testDataSource.query('DELETE FROM reservations');
      await testDataSource.query('DELETE FROM recurring_reservations');
      await testDataSource.query('DELETE FROM waitlist');
      await testDataSource.query('DELETE FROM tables');
      await testDataSource.query('DELETE FROM restaurants');
      await testDataSource.query('DELETE FROM users');
    }
  });

  describe('Restaurant API', () => {
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
        // Create test restaurants directly in database
        const restaurantRepo = testDataSource.getRepository(Restaurant);
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
        const restaurantRepo = testDataSource.getRepository(Restaurant);
        const tableRepo = testDataSource.getRepository(Table);

        const restaurant = await restaurantRepo.save({
          name: 'Test Restaurant',
          openingTime: '10:00',
          closingTime: '22:00',
        });

        await tableRepo.save([
          { restaurantId: restaurant.id, tableNumber: 1, capacity: 4, minCapacity: 1 },
          { restaurantId: restaurant.id, tableNumber: 2, capacity: 6, minCapacity: 2 },
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

  describe('Table API', () => {
    let testRestaurant: Restaurant;

    beforeEach(async () => {
      const restaurantRepo = testDataSource.getRepository(Restaurant);
      testRestaurant = await restaurantRepo.save({
        name: 'Test Restaurant',
        openingTime: '10:00',
        closingTime: '22:00',
      });
    });

    describe('POST /api/v1/restaurants/:restaurantId/tables', () => {
      it('should create a table successfully', async () => {
        const tableData = {
          tableNumber: 1,
          capacity: 4,
          minCapacity: 2,
          location: 'window',
        };

        const response = await request(app)
          .post(`/api/v1/restaurants/${testRestaurant.id}/tables`)
          .send(tableData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tableNumber).toBe(1);
        expect(response.body.data.capacity).toBe(4);
      });
    });
  });

  describe('Reservation API', () => {
    let testRestaurant: Restaurant;
    let testTable: Table;

    beforeEach(async () => {
      const restaurantRepo = testDataSource.getRepository(Restaurant);
      const tableRepo = testDataSource.getRepository(Table);

      testRestaurant = await restaurantRepo.save({
        name: 'Test Restaurant',
        openingTime: '10:00',
        closingTime: '22:00',
        totalTables: 1,
      });

      testTable = await tableRepo.save({
        restaurantId: testRestaurant.id,
        tableNumber: 1,
        capacity: 4,
        minCapacity: 1,
      });
    });

    describe('POST /api/v1/reservations', () => {
      it('should create a reservation successfully', async () => {
        const reservationData = {
          restaurantId: testRestaurant.id,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          customerEmail: 'john@example.com',
          partySize: 2,
          reservationDate: '2024-12-25',
          startTime: '19:00',
          durationMinutes: 90,
        };

        const response = await request(app)
          .post('/api/v1/reservations')
          .send(reservationData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.customerName).toBe('John Doe');
        expect(response.body.data.status).toBe(ReservationStatus.PENDING);
        expect(response.body.data.tableId).toBe(testTable.id);
      });

      it('should fail when party size exceeds table capacity', async () => {
        const reservationData = {
          restaurantId: testRestaurant.id,
          tableId: testTable.id,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          partySize: 6, // Table capacity is 4
          reservationDate: '2024-12-25',
          startTime: '19:00',
          durationMinutes: 90,
        };

        const response = await request(app)
          .post('/api/v1/reservations')
          .send(reservationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('cannot accommodate');
      });

      it('should fail when reservation is outside operating hours', async () => {
        const reservationData = {
          restaurantId: testRestaurant.id,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          partySize: 2,
          reservationDate: '2024-12-25',
          startTime: '08:00', // Restaurant opens at 10:00
          durationMinutes: 90,
        };

        const response = await request(app)
          .post('/api/v1/reservations')
          .send(reservationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('operating hours');
      });

      it('should prevent double booking (overlapping reservations)', async () => {
        // Create first reservation (using non-peak hours to avoid duration limit)
        const firstReservation = {
          restaurantId: testRestaurant.id,
          tableId: testTable.id,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          partySize: 2,
          reservationDate: '2024-12-25',
          startTime: '12:00', // Non-peak hours
          durationMinutes: 120, // 12:00 - 14:00
        };

        await request(app)
          .post('/api/v1/reservations')
          .send(firstReservation)
          .expect(201);

        // Try to create overlapping reservation
        const overlappingReservation = {
          restaurantId: testRestaurant.id,
          tableId: testTable.id,
          customerName: 'Jane Doe',
          customerPhone: '0987654321',
          partySize: 2,
          reservationDate: '2024-12-25',
          startTime: '13:00', // Overlaps with first reservation
          durationMinutes: 90,
        };

        const response = await request(app)
          .post('/api/v1/reservations')
          .send(overlappingReservation)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not available');
      });
    });

    describe('GET /api/v1/restaurants/:restaurantId/availability', () => {
      it('should return available time slots', async () => {
        const response = await request(app)
          .get(`/api/v1/restaurants/${testRestaurant.id}/availability`)
          .query({
            date: '2024-12-25',
            partySize: 2,
            durationMinutes: 90,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.availableSlots).toBeDefined();
        expect(Array.isArray(response.body.data.availableSlots)).toBe(true);
        expect(response.body.data.availableSlots.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/v1/reservations/:id/cancel', () => {
      it('should cancel a reservation successfully', async () => {
        // Create a reservation first
        const createResponse = await request(app)
          .post('/api/v1/reservations')
          .send({
            restaurantId: testRestaurant.id,
            customerName: 'John Doe',
            customerPhone: '1234567890',
            partySize: 2,
            reservationDate: '2024-12-25',
            startTime: '19:00',
            durationMinutes: 90,
          })
          .expect(201);

        const reservationId = createResponse.body.data.id;

        // Cancel the reservation
        const cancelResponse = await request(app)
          .post(`/api/v1/reservations/${reservationId}/cancel`)
          .send({ cancellationReason: 'Change of plans' })
          .expect(200);

        expect(cancelResponse.body.success).toBe(true);
        expect(cancelResponse.body.data.status).toBe(ReservationStatus.CANCELLED);
        expect(cancelResponse.body.data.cancellationReason).toBe('Change of plans');
      });
    });

    describe('POST /api/v1/reservations/:id/confirm', () => {
      it('should confirm a pending reservation', async () => {
        // Create a reservation first
        const createResponse = await request(app)
          .post('/api/v1/reservations')
          .send({
            restaurantId: testRestaurant.id,
            customerName: 'John Doe',
            customerPhone: '1234567890',
            partySize: 2,
            reservationDate: '2024-12-25',
            startTime: '19:00',
            durationMinutes: 90,
          })
          .expect(201);

        const reservationId = createResponse.body.data.id;

        // Confirm the reservation
        const confirmResponse = await request(app)
          .post(`/api/v1/reservations/${reservationId}/confirm`)
          .send({ sendConfirmation: true })
          .expect(200);

        expect(confirmResponse.body.success).toBe(true);
        expect(confirmResponse.body.data.status).toBe(ReservationStatus.CONFIRMED);
      });
    });
  });

  describe('Authentication API', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phone: '555-1234',
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.name).toBe('Test User');
        expect(response.body.data.user.email).toBe('test@example.com');
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
      });

      it('should fail with duplicate email', async () => {
        const userData = {
          name: 'Test User',
          email: 'duplicate@example.com',
          password: 'password123',
        };

        // Register first user
        await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        // Try to register with same email
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login successfully with valid credentials', async () => {
        // Register a user first
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: 'Login Test User',
            email: 'login@example.com',
            password: 'password123',
          })
          .expect(201);

        // Login
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'login@example.com',
            password: 'password123',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tokens.accessToken).toBeDefined();
      });

      it('should fail with invalid credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/auth/profile', () => {
      it('should return user profile with valid token', async () => {
        // Register and get token
        const registerResponse = await request(app)
          .post('/api/v1/auth/register')
          .send({
            name: 'Profile Test User',
            email: 'profile@example.com',
            password: 'password123',
          })
          .expect(201);

        const token = registerResponse.body.data.tokens.accessToken;

        // Get profile
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('profile@example.com');
      });

      it('should fail without token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Timezone API', () => {
    describe('GET /api/v1/timezones', () => {
      it('should return common timezones', async () => {
        const response = await request(app)
          .get('/api/v1/timezones')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('value');
        expect(response.body.data[0]).toHaveProperty('label');
        expect(response.body.data[0]).toHaveProperty('offset');
      });
    });

    describe('GET /api/v1/timezones/validate/:timezone', () => {
      it('should validate a valid timezone', async () => {
        const response = await request(app)
          .get('/api/v1/timezones/validate/America%2FNew_York')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isValid).toBe(true);
      });

      it('should invalidate an invalid timezone', async () => {
        const response = await request(app)
          .get('/api/v1/timezones/validate/Invalid%2FTimezone')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isValid).toBe(false);
      });
    });
  });
});