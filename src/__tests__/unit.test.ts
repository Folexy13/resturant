import 'reflect-metadata';
import { Restaurant } from '../entities/Restaurant';
import { Table } from '../entities/Table';
import { Reservation, ReservationStatus } from '../entities/Reservation';

describe('Entity Unit Tests', () => {
  describe('Restaurant Entity', () => {
    it('should check if restaurant is open at a given time', () => {
      const restaurant = new Restaurant();
      restaurant.openingTime = '10:00';
      restaurant.closingTime = '22:00';

      expect(restaurant.isOpenAt('12:00')).toBe(true);
      expect(restaurant.isOpenAt('09:00')).toBe(false);
      expect(restaurant.isOpenAt('23:00')).toBe(false);
    });

    it('should validate time range within operating hours', () => {
      const restaurant = new Restaurant();
      restaurant.openingTime = '10:00';
      restaurant.closingTime = '22:00';

      expect(restaurant.isTimeRangeValid('12:00', '14:00')).toBe(true);
      expect(restaurant.isTimeRangeValid('09:00', '11:00')).toBe(false);
      expect(restaurant.isTimeRangeValid('20:00', '23:00')).toBe(false);
    });
  });

  describe('Table Entity', () => {
    it('should check if table can accommodate party size', () => {
      const table = new Table();
      table.capacity = 4;
      table.minCapacity = 2;

      expect(table.canAccommodate(2)).toBe(true);
      expect(table.canAccommodate(4)).toBe(true);
      expect(table.canAccommodate(1)).toBe(false);
      expect(table.canAccommodate(5)).toBe(false);
    });

    it('should calculate fit score correctly', () => {
      const table = new Table();
      table.capacity = 4;
      table.minCapacity = 1;

      expect(table.getFitScore(4)).toBe(0);
      expect(table.getFitScore(2)).toBe(2);
      expect(table.getFitScore(5)).toBe(Infinity);
    });
  });

  describe('Reservation Entity', () => {
    it('should detect overlapping time ranges', () => {
      const reservation = new Reservation();
      reservation.startTime = '19:00';
      reservation.endTime = '21:00';

      // Overlapping cases
      expect(reservation.overlapsWithTimeRange('18:00', '19:30')).toBe(true);
      expect(reservation.overlapsWithTimeRange('20:00', '22:00')).toBe(true);
      expect(reservation.overlapsWithTimeRange('19:30', '20:30')).toBe(true);
      expect(reservation.overlapsWithTimeRange('18:00', '22:00')).toBe(true);

      // Non-overlapping cases
      expect(reservation.overlapsWithTimeRange('17:00', '19:00')).toBe(false);
      expect(reservation.overlapsWithTimeRange('21:00', '23:00')).toBe(false);
    });

    it('should check if reservation can be cancelled', () => {
      const reservation = new Reservation();

      reservation.status = ReservationStatus.PENDING;
      expect(reservation.canBeCancelled()).toBe(true);

      reservation.status = ReservationStatus.CONFIRMED;
      expect(reservation.canBeCancelled()).toBe(true);

      reservation.status = ReservationStatus.SEATED;
      expect(reservation.canBeCancelled()).toBe(false);

      reservation.status = ReservationStatus.COMPLETED;
      expect(reservation.canBeCancelled()).toBe(false);

      reservation.status = ReservationStatus.CANCELLED;
      expect(reservation.canBeCancelled()).toBe(false);
    });

    it('should check if reservation can be modified', () => {
      const reservation = new Reservation();

      reservation.status = ReservationStatus.PENDING;
      expect(reservation.canBeModified()).toBe(true);

      reservation.status = ReservationStatus.CONFIRMED;
      expect(reservation.canBeModified()).toBe(true);

      reservation.status = ReservationStatus.SEATED;
      expect(reservation.canBeModified()).toBe(false);
    });
  });
});

describe('Business Logic Tests', () => {
  describe('Time Calculations', () => {
    it('should calculate end time correctly', () => {
      const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      };

      expect(calculateEndTime('19:00', 90)).toBe('20:30');
      expect(calculateEndTime('22:00', 120)).toBe('00:00');
      expect(calculateEndTime('10:30', 45)).toBe('11:15');
    });
  });

  describe('Peak Hours Detection', () => {
    it('should detect peak hours correctly', () => {
      const isPeakHour = (startTime: string, peakStart: number, peakEnd: number): boolean => {
        const [hours] = startTime.split(':').map(Number);
        return hours >= peakStart && hours < peakEnd;
      };

      expect(isPeakHour('18:00', 18, 21)).toBe(true);
      expect(isPeakHour('19:30', 18, 21)).toBe(true);
      expect(isPeakHour('20:59', 18, 21)).toBe(true);
      expect(isPeakHour('17:00', 18, 21)).toBe(false);
      expect(isPeakHour('21:00', 18, 21)).toBe(false);
    });
  });

  describe('Time Slot Generation', () => {
    it('should generate correct time slots', () => {
      const generateTimeSlots = (
        openingTime: string,
        closingTime: string,
        durationMinutes: number,
        intervalMinutes: number
      ): Array<{ startTime: string; endTime: string }> => {
        const slots: Array<{ startTime: string; endTime: string }> = [];

        const toMinutes = (time: string): number => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };

        const toTimeString = (minutes: number): string => {
          const h = Math.floor(minutes / 60) % 24;
          const m = minutes % 60;
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        let openingMinutes = toMinutes(openingTime);
        const closingMinutes = toMinutes(closingTime);

        while (openingMinutes + durationMinutes <= closingMinutes) {
          const endMinutes = openingMinutes + durationMinutes;
          slots.push({
            startTime: toTimeString(openingMinutes),
            endTime: toTimeString(endMinutes),
          });
          openingMinutes += intervalMinutes;
        }

        return slots;
      };

      const slots = generateTimeSlots('10:00', '12:00', 60, 30);
      expect(slots.length).toBe(3);
      expect(slots[0]).toEqual({ startTime: '10:00', endTime: '11:00' });
      expect(slots[1]).toEqual({ startTime: '10:30', endTime: '11:30' });
      expect(slots[2]).toEqual({ startTime: '11:00', endTime: '12:00' });
    });
  });
});

describe('Validation Tests', () => {
  describe('Time Format Validation', () => {
    it('should validate time format correctly', () => {
      const isValidTimeFormat = (time: string): boolean => {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
      };

      expect(isValidTimeFormat('10:00')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
      expect(isValidTimeFormat('00:00')).toBe(true);
      expect(isValidTimeFormat('9:30')).toBe(true);
      expect(isValidTimeFormat('25:00')).toBe(false);
      expect(isValidTimeFormat('10:60')).toBe(false);
      expect(isValidTimeFormat('invalid')).toBe(false);
    });
  });

  describe('Date Format Validation', () => {
    it('should validate date format correctly', () => {
      const isValidDateFormat = (date: string): boolean => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(date);
      };

      expect(isValidDateFormat('2024-12-25')).toBe(true);
      expect(isValidDateFormat('2024-01-01')).toBe(true);
      expect(isValidDateFormat('24-12-25')).toBe(false);
      expect(isValidDateFormat('2024/12/25')).toBe(false);
      expect(isValidDateFormat('invalid')).toBe(false);
    });
  });
});