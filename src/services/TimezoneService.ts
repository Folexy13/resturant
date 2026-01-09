import moment from 'moment-timezone';

export class TimezoneService {
  private static instance: TimezoneService;

  private constructor() {}

  static getInstance(): TimezoneService {
    if (!TimezoneService.instance) {
      TimezoneService.instance = new TimezoneService();
    }
    return TimezoneService.instance;
  }

  /**
   * Get all available timezones
   */
  getAllTimezones(): string[] {
    return moment.tz.names();
  }

  /**
   * Validate if a timezone string is valid
   */
  isValidTimezone(timezone: string): boolean {
    return moment.tz.zone(timezone) !== null;
  }

  /**
   * Get current time in a specific timezone
   */
  getCurrentTime(timezone: string): moment.Moment {
    return moment.tz(timezone);
  }

  /**
   * Get current date in a specific timezone (YYYY-MM-DD format)
   */
  getCurrentDate(timezone: string): string {
    return moment.tz(timezone).format('YYYY-MM-DD');
  }

  /**
   * Get current time string in a specific timezone (HH:mm format)
   */
  getCurrentTimeString(timezone: string): string {
    return moment.tz(timezone).format('HH:mm');
  }

  /**
   * Convert a time from one timezone to another
   */
  convertTime(
    time: string,
    date: string,
    fromTimezone: string,
    toTimezone: string
  ): { date: string; time: string } {
    const dateTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', fromTimezone);
    const converted = dateTime.tz(toTimezone);
    return {
      date: converted.format('YYYY-MM-DD'),
      time: converted.format('HH:mm'),
    };
  }

  /**
   * Convert a datetime to UTC
   */
  toUTC(date: string, time: string, timezone: string): Date {
    return moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone).utc().toDate();
  }

  /**
   * Convert UTC datetime to a specific timezone
   */
  fromUTC(utcDate: Date, timezone: string): { date: string; time: string } {
    const converted = moment.utc(utcDate).tz(timezone);
    return {
      date: converted.format('YYYY-MM-DD'),
      time: converted.format('HH:mm'),
    };
  }

  /**
   * Check if a time is within operating hours in a specific timezone
   */
  isWithinOperatingHours(
    time: string,
    openingTime: string,
    closingTime: string,
    timezone: string
  ): boolean {
    const now = moment.tz(timezone);
    const checkTime = moment.tz(`${now.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
    const opening = moment.tz(`${now.format('YYYY-MM-DD')} ${openingTime}`, 'YYYY-MM-DD HH:mm', timezone);
    const closing = moment.tz(`${now.format('YYYY-MM-DD')} ${closingTime}`, 'YYYY-MM-DD HH:mm', timezone);

    // Handle closing time after midnight
    if (closing.isBefore(opening)) {
      return checkTime.isSameOrAfter(opening) || checkTime.isBefore(closing);
    }

    return checkTime.isSameOrAfter(opening) && checkTime.isBefore(closing);
  }

  /**
   * Get timezone offset in hours
   */
  getTimezoneOffset(timezone: string): number {
    return moment.tz(timezone).utcOffset() / 60;
  }

  /**
   * Get timezone abbreviation (e.g., EST, PST)
   */
  getTimezoneAbbreviation(timezone: string): string {
    return moment.tz(timezone).format('z');
  }

  /**
   * Format a date/time for display in a specific timezone
   */
  formatForDisplay(
    date: string,
    time: string,
    timezone: string,
    format: string = 'MMMM D, YYYY h:mm A z'
  ): string {
    return moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone).format(format);
  }

  /**
   * Get the start and end of a day in a specific timezone
   */
  getDayBounds(date: string, timezone: string): { start: Date; end: Date } {
    const dayStart = moment.tz(date, 'YYYY-MM-DD', timezone).startOf('day');
    const dayEnd = moment.tz(date, 'YYYY-MM-DD', timezone).endOf('day');
    return {
      start: dayStart.utc().toDate(),
      end: dayEnd.utc().toDate(),
    };
  }

  /**
   * Check if a date is today in a specific timezone
   */
  isToday(date: string, timezone: string): boolean {
    const today = moment.tz(timezone).format('YYYY-MM-DD');
    return date === today;
  }

  /**
   * Check if a date is in the past in a specific timezone
   */
  isPastDate(date: string, timezone: string): boolean {
    const today = moment.tz(timezone).startOf('day');
    const checkDate = moment.tz(date, 'YYYY-MM-DD', timezone).startOf('day');
    return checkDate.isBefore(today);
  }

  /**
   * Check if a datetime is in the past in a specific timezone
   */
  isPastDateTime(date: string, time: string, timezone: string): boolean {
    const now = moment.tz(timezone);
    const checkDateTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
    return checkDateTime.isBefore(now);
  }

  /**
   * Add duration to a time
   */
  addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate duration between two times in minutes
   */
  getDurationMinutes(startTime: string, endTime: string): number {
    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);
    
    let startTotal = startHours * 60 + startMins;
    let endTotal = endHours * 60 + endMins;
    
    // Handle crossing midnight
    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }
    
    return endTotal - startTotal;
  }

  /**
   * Get common timezone options for UI
   */
  getCommonTimezones(): { value: string; label: string; offset: string }[] {
    const common = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Dubai',
      'Asia/Singapore',
      'Australia/Sydney',
      'Pacific/Auckland',
      'Africa/Lagos',
      'Africa/Cairo',
    ];

    return common.map(tz => ({
      value: tz,
      label: tz.replace(/_/g, ' '),
      offset: `UTC${moment.tz(tz).format('Z')}`,
    }));
  }
}

export const timezoneService = TimezoneService.getInstance();