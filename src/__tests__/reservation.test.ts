import request from 'supertest';
import { Application } from 'express';
import { DataSource } from 'typeorm';
import { createApp } from '../app';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';

describe('Reservation API', () => {
  let app: Application;
  let dataSource: DataSource;
  let testRestaurant: Restaurant;
  let testTable: Table;

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
    // Clear all tables
    await dataSource.getRepository(Reservation).clear();
    await dataSource.getRepository(Waitlist).clear();
    await dataSource.getRepository(Table).clear();
    await dataSource.getRepository(Restaurant).clear();

    // Create test restaurant
    const restaurantRepo = dataSource.getRepository(Restaurant);
    testRestaurant = await restaurantRepo.save({
      name: 'Test Restaurant',
      openingTime: '10:00',
      closingTime: '22:00',
      totalTables: 0,
    });

    // Create test table
    const tableRepo = dataSource.getRepository(Table);
    testTable = await tableRepo.save({
      restaurantId: testRestaurant.id,
      tableNumber: 1,
      capacity: 4,
      minCapacity: 1,
    });

    // Update restaurant table count
    testRestaurant.totalTables = 1;
    await restaurantRepo.save(testRestaurant);
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
      // Create first reservation
      const firstReservation = {
        restaurantId: testRestaurant.id,
        tableId: testTable.id,
        customerName: 'John Doe',
        customerPhone: '1234567890',
        partySize: 2,
        reservationDate: '2024-12-25',
        startTime: '19:00',
        durationMinutes: 120, // 19:00 - 21:00
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
        startTime: '20:00', // Overlaps with first reservation
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

    it('should exclude booked time slots from availability', async () => {
      // Create a reservation
      await request(app)
        .post('/api/v1/reservations')
        .send({
          restaurantId: testRestaurant.id,
          tableId: testTable.id,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          partySize: 2,
          reservationDate: '2024-12-25',
          startTime: '19:00',
          durationMinutes: 90,
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/v1/restaurants/${testRestaurant.id}/availability`)
        .query({
          date: '2024-12-25',
          partySize: 2,
          durationMinutes: 90,
        })
        .expect(200);

      // The 19:00 slot should not have the booked table available
      const slot1900 = response.body.data.availableSlots.find(
        (slot: any) => slot.startTime === '19:00'
      );

      if (slot1900) {
        const bookedTable = slot1900.availableTables.find(
          (t: any) => t.id === testTable.id
        );
        expect(bookedTable).toBeUndefined();
      }
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