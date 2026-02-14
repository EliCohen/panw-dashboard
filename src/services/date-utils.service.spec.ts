import { DateUtilsService } from './date-utils.service';

describe('DateUtilsService', () => {
  let service: DateUtilsService;

  beforeEach(() => {
    service = new DateUtilsService();
  });

  describe('startOfDay', () => {
    it('should zero out time components', () => {
      const date = new Date(2025, 5, 15, 14, 30, 45, 123);
      const result = service.startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
    });

    it('should not mutate the original date', () => {
      const date = new Date(2025, 5, 15, 14, 30);
      service.startOfDay(date);
      expect(date.getHours()).toBe(14);
    });
  });

  describe('calculateDaysBetween', () => {
    it('should return 0 for same day', () => {
      const date = new Date(2025, 5, 15);
      expect(service.calculateDaysBetween(date, date)).toBe(0);
    });

    it('should return positive for future dates', () => {
      const start = new Date(2025, 5, 15);
      const end = new Date(2025, 5, 20);
      expect(service.calculateDaysBetween(start, end)).toBe(5);
    });

    it('should return negative for past dates', () => {
      const start = new Date(2025, 5, 20);
      const end = new Date(2025, 5, 15);
      expect(service.calculateDaysBetween(start, end)).toBe(-5);
    });

    it('should ignore time components', () => {
      const start = new Date(2025, 5, 15, 23, 59);
      const end = new Date(2025, 5, 16, 0, 1);
      expect(service.calculateDaysBetween(start, end)).toBe(1);
    });
  });

  describe('parseDateParts', () => {
    it('should parse ISO format YYYY-MM-DD', () => {
      const result = service.parseDateParts('2025-09-25');
      expect(result).toEqual({ month: 8, day: 25 }); // month is 0-indexed
    });

    it('should parse DD/MM format', () => {
      const result = service.parseDateParts('25/09');
      expect(result).toEqual({ month: 8, day: 25 });
    });

    it('should parse DD-MM format', () => {
      const result = service.parseDateParts('25-09');
      expect(result).toEqual({ month: 8, day: 25 });
    });

    it('should handle ordinals like January 1st', () => {
      const result = service.parseDateParts('January 1st');
      expect(result).toBeDefined();
      expect(result!.month).toBe(0);
      expect(result!.day).toBe(1);
    });

    it('should handle ordinals like March 3rd', () => {
      const result = service.parseDateParts('March 3rd');
      expect(result).toBeDefined();
      expect(result!.month).toBe(2);
      expect(result!.day).toBe(3);
    });

    it('should return undefined for garbage input', () => {
      expect(service.parseDateParts('not-a-date')).toBeUndefined();
    });

    it('should trim whitespace', () => {
      const result = service.parseDateParts('  2025-09-25  ');
      expect(result).toEqual({ month: 8, day: 25 });
    });
  });

  describe('parseDropDate', () => {
    it('should parse DD.MM.YY format', () => {
      const result = service.parseDropDate('15.06.25');
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(5);
      expect(result!.getDate()).toBe(15);
    });

    it('should parse DD.MM.YYYY format', () => {
      const result = service.parseDropDate('15.06.2025');
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(5);
      expect(result!.getDate()).toBe(15);
    });

    it('should fallback to Date constructor for other formats', () => {
      const result = service.parseDropDate('2025-06-15');
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2025);
    });

    it('should return undefined for invalid date', () => {
      expect(service.parseDropDate('garbage')).toBeUndefined();
    });
  });

  describe('formatBirthdayDate', () => {
    it('should format as uppercase month and day', () => {
      const date = new Date(2025, 0, 15); // January 15
      const result = service.formatBirthdayDate(date);
      expect(result).toBe('JANUARY 15');
    });

    it('should handle different months', () => {
      const date = new Date(2025, 11, 25); // December 25
      const result = service.formatBirthdayDate(date);
      expect(result).toBe('DECEMBER 25');
    });
  });

  describe('formatDropDate', () => {
    it('should format as DD Mon', () => {
      const date = new Date(2025, 0, 15); // January 15
      const result = service.formatDropDate(date);
      expect(result).toBe('15 Jan');
    });
  });

  describe('getNextBirthdayDate', () => {
    it('should return this year if birthday has not passed', () => {
      const today = new Date(2025, 0, 1); // Jan 1
      const result = service.getNextBirthdayDate('2000-06-15', today);
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(5);
      expect(result!.getDate()).toBe(15);
    });

    it('should return next year if birthday has passed', () => {
      const today = new Date(2025, 8, 1); // Sep 1
      const result = service.getNextBirthdayDate('2000-06-15', today);
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(5);
      expect(result!.getDate()).toBe(15);
    });

    it('should return today if birthday is today', () => {
      const today = new Date(2025, 5, 15); // Jun 15
      const result = service.getNextBirthdayDate('2000-06-15', today);
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(5);
      expect(result!.getDate()).toBe(15);
    });

    it('should return undefined for invalid date', () => {
      const today = new Date(2025, 0, 1);
      expect(service.getNextBirthdayDate('not-a-date', today)).toBeUndefined();
    });
  });
});
