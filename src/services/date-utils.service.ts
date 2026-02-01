import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateUtilsService {
  private readonly dayInMs = 1000 * 60 * 60 * 24;

  /**
   * Returns a date set to the start of the day (midnight)
   */
  startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Calculates the number of days between two dates
   */
  calculateDaysBetween(start: Date, end: Date): number {
    const startTime = this.startOfDay(start).getTime();
    const endTime = this.startOfDay(end).getTime();
    return Math.ceil((endTime - startTime) / this.dayInMs);
  }

  /**
   * Parses date input in various formats (ISO, MM/DD, MM-DD, with ordinals)
   * Returns month (0-11) and day (1-31)
   */
  parseDateParts(dateInput: string): { month: number; day: number } | undefined {
    const trimmed = dateInput.trim();
    
    // ISO format: YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return { month: Number(isoMatch[2]) - 1, day: Number(isoMatch[3]) };
    }

    // MM/DD or MM-DD format
    const monthDayMatch = trimmed.match(/^(\d{2})[-/](\d{2})$/);
    if (monthDayMatch) {
      return { month: Number(monthDayMatch[2]) - 1, day: Number(monthDayMatch[1]) };
    }

    // Try parsing with Date constructor (handles various formats including ordinals)
    const cleaned = trimmed.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) {
      return { month: parsed.getMonth(), day: parsed.getDate() };
    }

    return undefined;
  }

  /**
   * Parses drop date format: DD.MM.YY or DD.MM.YYYY
   */
  parseDropDate(dateString: string): Date | undefined {
    const trimmed = dateString.trim();
    const dotSeparated = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
    
    if (!dotSeparated) {
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const day = Number(dotSeparated[1]);
    const month = Number(dotSeparated[2]) - 1;
    const rawYear = Number(dotSeparated[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  /**
   * Formats a date for birthday display (e.g., "JANUARY 15")
   */
  formatBirthdayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(date).toUpperCase();
  }

  /**
   * Formats a date for drop display (e.g., "15 Jan")
   */
  formatDropDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
  }

  /**
   * Gets the next occurrence of a birthday date from today
   */
  getNextBirthdayDate(dateInput: string, today: Date): Date | undefined {
    const parts = this.parseDateParts(dateInput);
    if (!parts) {
      return undefined;
    }

    const thisYearBirthday = new Date(today.getFullYear(), parts.month, parts.day);
    if (Number.isNaN(thisYearBirthday.getTime())) {
      return undefined;
    }

    if (thisYearBirthday >= today) {
      return thisYearBirthday;
    }

    const nextYearBirthday = new Date(thisYearBirthday);
    nextYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
    return nextYearBirthday;
  }
}
