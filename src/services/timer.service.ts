import { Injectable } from '@angular/core';
import { DASHBOARD_CONSTANTS } from './utils.service';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private handles = new Map<string, ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>>();

  startInterval(key: string, callback: () => void, ms: number): void {
    this.stop(key);
    this.handles.set(key, setInterval(callback, ms));
  }

  startTimeout(key: string, callback: () => void, ms: number): void {
    this.stop(key);
    this.handles.set(key, setTimeout(callback, ms));
  }

  stop(key: string): void {
    const handle = this.handles.get(key);
    if (handle !== undefined) {
      clearInterval(handle as ReturnType<typeof setInterval>);
      clearTimeout(handle as ReturnType<typeof setTimeout>);
      this.handles.delete(key);
    }
  }

  stopAll(): void {
    this.handles.forEach((_, key) => this.stop(key));
  }

  isRunning(key: string): boolean {
    return this.handles.has(key);
  }

  isWorkoutReminderTime(now: Date = new Date()): boolean {
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const day = now.getDay();
    const isWeekdayWindow = DASHBOARD_CONSTANTS.WORKOUT_WEEKDAYS.includes(day as 0 | 1 | 2 | 3 | 4);
    const isTimeWindow = minutesSinceMidnight >= DASHBOARD_CONSTANTS.WORKOUT_START_MINUTES
      && minutesSinceMidnight < DASHBOARD_CONSTANTS.WORKOUT_END_MINUTES;
    return isWeekdayWindow && isTimeWindow;
  }

  msUntilMidnight(now: Date = new Date()): number {
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.max(nextMidnight.getTime() - now.getTime(), 0);
  }
}
