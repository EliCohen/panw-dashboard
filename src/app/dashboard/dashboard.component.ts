import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { Birthday, Drop, Team, VersionData } from '../../models';
import { calendarIcon, cakeIcon, checkIcon, chevronIcon, clockIcon, usersIcon, usersMiniIcon } from '../../icons';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, LayoutModule, ScrollingModule, AsyncPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dayInMs = 1000 * 60 * 60 * 24;
  private readonly upcomingWindowDays = 7;

  versionData: VersionData = {
    name: 'Loading…',
    startDate: new Date(),
    endDate: new Date(),
    totalDays: 0,
    daysLeft: 0,
    progress: 0,
    milestones: [],
    branches: []
  };

  drops: Drop[] = [];
  teams: Team[] = [];
  birthdays: Birthday[] = [];
  upcomingBirthday?: Birthday;
  nextBirthday?: Birthday;
  hasUpcomingBirthday = false;

  activeSlide = 0;
  slideIntervalMs = 10000;
  weeksLeft = 0;

  // Inline SVG strings for quick binding in the template.
  readonly calendarIcon = calendarIcon;
  readonly cakeIcon = cakeIcon;
  readonly checkIcon = checkIcon;
  readonly chevronIcon = chevronIcon;
  readonly clockIcon = clockIcon;
  readonly usersIcon = usersIcon;
  readonly usersMiniIcon = usersMiniIcon;

  private rotateHandle?: ReturnType<typeof setInterval>;
  private subscriptions = new Subscription();

  private readonly configService = inject(ConfigService);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    breakpointObserver: BreakpointObserver
  ) {
    this.subscriptions.add(
      breakpointObserver.observe([Breakpoints.Handset]).subscribe(({ matches }) => {
        this.slideIntervalMs = matches ? 7000 : 10000;
        this.restartRotation();
      })
    );
  }

  ngOnInit(): void {
    this.loadConfig();
    this.startRotation();
  }

  ngOnDestroy(): void {
    this.stopRotation();
    this.subscriptions.unsubscribe();
  }

  selectSlide(index: number): void {
    this.activeSlide = index;
    this.restartRotation();
  }

  private startRotation(): void {
    if (this.rotateHandle) {
      return;
    }
    this.rotateHandle = setInterval(() => {
      if (this.teams.length > 0) {
        this.activeSlide = (this.activeSlide + 1) % this.teams.length;
        this.cdr.markForCheck();
      }
    }, this.slideIntervalMs);
  }

  private stopRotation(): void {
    if (this.rotateHandle) {
      clearInterval(this.rotateHandle);
      this.rotateHandle = undefined;
    }
  }

  private restartRotation(): void {
    this.stopRotation();
    this.startRotation();
  }

  private loadConfig(): void {
    this.subscriptions.add(
      this.configService.getConfig().subscribe({
        next: (data) => {
          this.versionData = this.calculateVersionData(data.versionData);
          this.weeksLeft = Math.max(Math.ceil(this.versionData.daysLeft / 7), 0);
          this.drops = this.decorateDrops(data.drops);
          this.teams = Array.isArray(data.teams) ? data.teams : [];
          const decoratedBirthdays = this.prepareBirthdays(data.birthdays);
          this.birthdays = decoratedBirthdays;
          this.upcomingBirthday = decoratedBirthdays.find((birthday) => birthday.daysAway <= this.upcomingWindowDays);
          this.hasUpcomingBirthday = Boolean(this.upcomingBirthday);
          this.nextBirthday = decoratedBirthdays.find((birthday) => birthday !== this.upcomingBirthday);
          this.activeSlide = 0;
          this.restartRotation();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load configuration', error);
        }
      })
    );
  }

  private calculateVersionData(versionData: VersionData): VersionData {
    const startDate = new Date(versionData.startDate);
    const endDate = new Date(versionData.endDate);
    const now = new Date();

    const totalDurationMs = Math.max(endDate.getTime() - startDate.getTime(), 0);
    const elapsedMs = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalDurationMs);
    const remainingMs = Math.max(endDate.getTime() - now.getTime(), 0);

    const progress = totalDurationMs === 0 ? 0 : Math.round((elapsedMs / totalDurationMs) * 100);
    const totalDays = totalDurationMs === 0 ? 0 : Math.ceil(totalDurationMs / this.dayInMs);
    const daysLeft = remainingMs === 0 ? 0 : Math.ceil(remainingMs / this.dayInMs);

    return {
      ...versionData,
      startDate,
      endDate,
      milestones: Array.isArray(versionData.milestones) ? versionData.milestones : [],
      branches: Array.isArray(versionData.branches) ? versionData.branches : [],
      totalDays,
      daysLeft,
      progress
    };
  }

  private prepareBirthdays(birthdays: Birthday[]): Birthday[] {
    if (!Array.isArray(birthdays) || birthdays.length === 0) {
      return [];
    }

    const today = this.startOfDay(new Date());
    const upcoming = birthdays
      .map((birthday) => this.decorateBirthday(birthday, today))
      .filter((birthday): birthday is Birthday => birthday !== undefined)
      .sort((a, b) => a.daysAway - b.daysAway);

    if (upcoming.length === 1) {
      return upcoming;
    }

    if (upcoming.length >= 2) {
      return upcoming.slice(0, 2);
    }

    return [];
  }

  private decorateBirthday(birthday: Birthday, today: Date): Birthday | undefined {
    const nextBirthdayDate = this.getNextBirthdayDate(birthday.date, today);
    if (!nextBirthdayDate) {
      return undefined;
    }

    const daysAway = Math.max(this.calculateDaysBetween(today, nextBirthdayDate), 0);
    const displayDate = this.formatBirthdayDate(nextBirthdayDate);

    return { ...birthday, daysAway, date: displayDate };
  }

  private getNextBirthdayDate(dateInput: string, today: Date): Date | undefined {
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

  private parseDateParts(dateInput: string): { month: number; day: number } | undefined {
    const trimmed = dateInput.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return { month: Number(isoMatch[2]) - 1, day: Number(isoMatch[3]) };
    }

    const monthDayMatch = trimmed.match(/^(\d{2})[-/](\d{2})$/);
    if (monthDayMatch) {
      return { month: Number(monthDayMatch[2]) - 1, day: Number(monthDayMatch[1]) };
    }

    const cleaned = trimmed.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) {
      return { month: parsed.getMonth(), day: parsed.getDate() };
    }

    return undefined;
  }

  private calculateDaysBetween(start: Date, end: Date): number {
    const startTime = this.startOfDay(start).getTime();
    const endTime = this.startOfDay(end).getTime();
    return Math.ceil((endTime - startTime) / this.dayInMs);
  }

  private formatBirthdayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(date).toUpperCase();
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private decorateDrops(drops: Drop[]): Drop[] {
    if (!Array.isArray(drops)) {
      return [];
    }

    const today = this.startOfDay(new Date());
    const parsed = drops
      .map((drop) => {
        const parsedDate = this.parseDropDate(drop.date);
        return { ...drop, parsedDate };
      })
      .sort((a, b) => {
        if (!a.parsedDate || !b.parsedDate) {
          return 0;
        }
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      });

    const currentIndex = parsed.findIndex((drop) => drop.parsedDate && drop.parsedDate >= today);

    return parsed.map((drop, index) => {
      if (!drop.parsedDate) {
        return drop;
      }

      let status: Drop['status'] = 'upcoming';
      if (currentIndex === -1) {
        status = 'completed';
      } else if (index < currentIndex) {
        status = 'completed';
      } else if (index === currentIndex) {
        status = 'current';
      }

      return {
        ...drop,
        status,
        date: this.formatDropDate(drop.parsedDate)
      };
    });
  }

  private parseDropDate(dateString: string): Date | undefined {
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

  private formatDropDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
  }
}
