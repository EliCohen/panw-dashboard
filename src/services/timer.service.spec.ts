import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new TimerService();
  });

  afterEach(() => {
    service.stopAll();
    vi.useRealTimers();
  });

  describe('startInterval / stop', () => {
    it('should call callback on interval', () => {
      const callback = vi.fn();
      service.startInterval('test', callback, 1000);

      vi.advanceTimersByTime(3000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should stop calling after stop()', () => {
      const callback = vi.fn();
      service.startInterval('test', callback, 1000);

      vi.advanceTimersByTime(2000);
      service.stop('test');
      vi.advanceTimersByTime(3000);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should replace existing interval with same key', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      service.startInterval('test', callback1, 1000);
      service.startInterval('test', callback2, 1000);

      vi.advanceTimersByTime(1000);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('startTimeout', () => {
    it('should call callback after delay', () => {
      const callback = vi.fn();
      service.startTimeout('test', callback, 5000);

      vi.advanceTimersByTime(4999);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback after stop', () => {
      const callback = vi.fn();
      service.startTimeout('test', callback, 5000);
      service.stop('test');

      vi.advanceTimersByTime(10000);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('isRunning', () => {
    it('should return true for running timer', () => {
      service.startInterval('test', () => {}, 1000);
      expect(service.isRunning('test')).toBe(true);
    });

    it('should return false after stop', () => {
      service.startInterval('test', () => {}, 1000);
      service.stop('test');
      expect(service.isRunning('test')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      expect(service.isRunning('nonexistent')).toBe(false);
    });
  });

  describe('stopAll', () => {
    it('should clear all handles', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      service.startInterval('a', callback1, 1000);
      service.startInterval('b', callback2, 1000);

      service.stopAll();
      vi.advanceTimersByTime(5000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(service.isRunning('a')).toBe(false);
      expect(service.isRunning('b')).toBe(false);
    });
  });

  describe('isWorkoutReminderTime', () => {
    it('should return true at 11:45 on Sunday', () => {
      // Sunday, 11:45 AM
      const date = new Date(2025, 5, 15, 11, 45); // June 15, 2025 is a Sunday
      expect(service.isWorkoutReminderTime(date)).toBe(true);
    });

    it('should return true at 11:59 on Monday', () => {
      const date = new Date(2025, 5, 16, 11, 59); // Monday
      expect(service.isWorkoutReminderTime(date)).toBe(true);
    });

    it('should return false at 12:00 (end of window)', () => {
      const date = new Date(2025, 5, 15, 12, 0); // Sunday 12:00
      expect(service.isWorkoutReminderTime(date)).toBe(false);
    });

    it('should return false at 11:44 (before window)', () => {
      const date = new Date(2025, 5, 15, 11, 44); // Sunday 11:44
      expect(service.isWorkoutReminderTime(date)).toBe(false);
    });

    it('should return false on Friday', () => {
      const date = new Date(2025, 5, 20, 11, 50); // Friday
      expect(service.isWorkoutReminderTime(date)).toBe(false);
    });

    it('should return false on Saturday', () => {
      const date = new Date(2025, 5, 21, 11, 50); // Saturday
      expect(service.isWorkoutReminderTime(date)).toBe(false);
    });
  });

  describe('msUntilMidnight', () => {
    it('should compute correct ms at noon', () => {
      const noon = new Date(2025, 5, 15, 12, 0, 0, 0);
      const result = service.msUntilMidnight(noon);
      expect(result).toBe(12 * 60 * 60 * 1000); // 12 hours in ms
    });

    it('should return small value near midnight', () => {
      const nearMidnight = new Date(2025, 5, 15, 23, 59, 59, 0);
      const result = service.msUntilMidnight(nearMidnight);
      expect(result).toBe(1000); // 1 second
    });

    it('should return 0 or positive for any time', () => {
      const date = new Date();
      expect(service.msUntilMidnight(date)).toBeGreaterThanOrEqual(0);
    });
  });
});
