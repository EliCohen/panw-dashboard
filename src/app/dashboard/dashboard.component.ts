import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Birthday, Drop, Feature, Team, VersionData, RawVersionData } from '../../models';
import { calendarIcon, cakeIcon, checkIcon, chevronIcon, clockIcon, usersIcon, usersMiniIcon, pushupIcon } from '../../icons';
import { ConfigService } from '../../services/config.service';
import { DateUtilsService } from '../../services/date-utils.service';
import { roundTo, DASHBOARD_CONSTANTS } from '../../services/utils.service';
import { VersionHeaderComponent } from './components/version-header/version-header.component';
import { RoadmapComponent } from './components/roadmap/roadmap.component';
import { TeamCarouselComponent } from './components/team-carousel/team-carousel.component';
import { BirthdayCardComponent } from './components/birthday-card/birthday-card.component';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LayoutModule,
    VersionHeaderComponent,
    RoadmapComponent,
    TeamCarouselComponent,
    BirthdayCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
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
  slideIntervalMs: number = DASHBOARD_CONSTANTS.SLIDE_INTERVAL_DESKTOP_MS;
  weeksLeft: number = 0;
  showWorkoutReminder = false;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Inline SVG strings for quick binding in the template.
  readonly calendarIcon: SafeHtml;
  readonly cakeIcon: SafeHtml;
  readonly checkIcon: SafeHtml;
  readonly chevronIcon: SafeHtml;
  readonly clockIcon: SafeHtml;
  readonly usersIcon: SafeHtml;
  readonly usersMiniIcon: SafeHtml;
  readonly pushupIcon: SafeHtml;

  private rotateHandle?: ReturnType<typeof setInterval>;
  private workoutReminderHandle?: ReturnType<typeof setInterval>;
  private configRefreshTimeout?: ReturnType<typeof setTimeout>;
  private configSub?: Subscription;
  private subscriptions = new Subscription();

  private readonly configService = inject(ConfigService);
  private readonly dateUtils = inject(DateUtilsService);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    breakpointObserver: BreakpointObserver,
    private readonly sanitizer: DomSanitizer
  ) {
    this.calendarIcon = this.sanitizeIcon(calendarIcon);
    this.cakeIcon = this.sanitizeIcon(cakeIcon);
    this.checkIcon = this.sanitizeIcon(checkIcon);
    this.chevronIcon = this.sanitizeIcon(chevronIcon);
    this.clockIcon = this.sanitizeIcon(clockIcon);
    this.usersIcon = this.sanitizeIcon(usersIcon);
    this.usersMiniIcon = this.sanitizeIcon(usersMiniIcon);
    this.pushupIcon = this.sanitizeIcon(pushupIcon);

    this.subscriptions.add(
      breakpointObserver.observe([Breakpoints.Handset]).subscribe(({ matches }) => {
        this.slideIntervalMs = matches 
          ? DASHBOARD_CONSTANTS.SLIDE_INTERVAL_MOBILE_MS 
          : DASHBOARD_CONSTANTS.SLIDE_INTERVAL_DESKTOP_MS;
        this.restartRotation();
      })
    );
  }

  ngOnInit(): void {
    this.loadConfig();
    this.startRotation();
    this.startWorkoutReminder();
    this.startConfigRefresh();
  }

  ngOnDestroy(): void {
    this.stopRotation();
    this.stopWorkoutReminder();
    this.stopConfigRefresh();
    this.subscriptions.unsubscribe();
  }

  selectSlide(index: number): void {
    this.activeSlide = index;
    this.restartRotation();
  }

  onSlideSelected(index: number): void {
    this.selectSlide(index);
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

  private startWorkoutReminder(): void {
    if (this.workoutReminderHandle) {
      return;
    }
    this.updateWorkoutReminderVisibility();
    this.workoutReminderHandle = setInterval(() => {
      this.updateWorkoutReminderVisibility();
    }, DASHBOARD_CONSTANTS.WORKOUT_REMINDER_CHECK_INTERVAL_MS);
  }

  private stopWorkoutReminder(): void {
    if (this.workoutReminderHandle) {
      clearInterval(this.workoutReminderHandle);
      this.workoutReminderHandle = undefined;
    }
  }

  private startConfigRefresh(): void {
    if (this.configRefreshTimeout) {
      return;
    }
    this.scheduleNextMidnightRefresh();
  }

  private scheduleNextMidnightRefresh(): void {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = Math.max(nextMidnight.getTime() - now.getTime(), 0);

    this.configRefreshTimeout = setTimeout(() => {
      this.configRefreshTimeout = undefined;
      this.reloadConfigForMidnight();
      this.scheduleNextMidnightRefresh();
    }, msUntilMidnight);
  }

  private stopConfigRefresh(): void {
    if (this.configRefreshTimeout) {
      clearTimeout(this.configRefreshTimeout);
      this.configRefreshTimeout = undefined;
    }
  }

  private reloadConfigForMidnight(): void {
    this.configService.clearCache();
    this.loadConfig();
  }

  private updateWorkoutReminderVisibility(): void {
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const day = now.getDay();
    // Sunday = 0, Monday = 1, ..., Friday = 5
    // WORKOUT_WEEKDAYS is [0, 1, 2, 3, 4] which means Sunday through Thursday
    const isWeekdayWindow = DASHBOARD_CONSTANTS.WORKOUT_WEEKDAYS.includes(day as 0 | 1 | 2 | 3 | 4);
    const isTimeWindow = minutesSinceMidnight >= DASHBOARD_CONSTANTS.WORKOUT_START_MINUTES 
      && minutesSinceMidnight < DASHBOARD_CONSTANTS.WORKOUT_END_MINUTES;
    this.showWorkoutReminder = isWeekdayWindow && isTimeWindow;
    this.cdr.markForCheck();
  }

  loadConfig(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.configSub?.unsubscribe();
    this.configSub = this.configService.getConfig().subscribe({
      next: (data) => {
        try {
          this.versionData = this.calculateVersionData(data.versionData);
          this.weeksLeft = Math.max(roundTo(this.versionData.daysLeft / 7, 1), 0);
          this.drops = this.decorateDrops(data.drops);
          this.teams = Array.isArray(data.teams) ? data.teams.map((team) => this.decorateTeam(team)) : [];
          const decoratedBirthdays = this.prepareBirthdays(data.birthdays);
          this.birthdays = decoratedBirthdays;
          this.upcomingBirthday = decoratedBirthdays.find(
            (birthday) => birthday.daysAway <= DASHBOARD_CONSTANTS.UPCOMING_BIRTHDAY_WINDOW_DAYS
          );
          this.hasUpcomingBirthday = Boolean(this.upcomingBirthday);
          this.nextBirthday = decoratedBirthdays.find((birthday) => birthday !== this.upcomingBirthday);
          this.activeSlide = 0;
          this.restartRotation();
          this.isLoading = false;
          this.cdr.markForCheck();
        } catch (error) {
          this.handleError('Failed to process configuration data', error);
        }
      },
      error: (error) => {
        this.handleError('Failed to load configuration', error);
      }
    });
    this.subscriptions.add(this.configSub);
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    this.cdr.markForCheck();
  }

  private sanitizeIcon(rawSvg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(rawSvg);
  }

  private calculateVersionData(versionData: RawVersionData): VersionData {
    const startDate = new Date(versionData.startDate);
    const endDate = new Date(versionData.endDate);
    const now = new Date();

    const totalDurationMs = Math.max(endDate.getTime() - startDate.getTime(), 0);
    const elapsedMs = Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalDurationMs);
    const remainingMs = Math.max(endDate.getTime() - now.getTime(), 0);

    const progress = totalDurationMs === 0 ? 0 : Math.round((elapsedMs / totalDurationMs) * 100);
    const totalDays = totalDurationMs === 0 ? 0 : Math.ceil(totalDurationMs / DASHBOARD_CONSTANTS.DAY_IN_MS);
    const daysLeft = remainingMs === 0 ? 0 : Math.ceil(remainingMs / DASHBOARD_CONSTANTS.DAY_IN_MS);

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

    const today = this.dateUtils.startOfDay(new Date());
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
    const nextBirthdayDate = this.dateUtils.getNextBirthdayDate(birthday.date, today);
    if (!nextBirthdayDate) {
      return undefined;
    }

    const daysAway = Math.max(this.dateUtils.calculateDaysBetween(today, nextBirthdayDate), 0);
    const displayDate = this.dateUtils.formatBirthdayDate(nextBirthdayDate);

    return { ...birthday, daysAway, date: displayDate };
  }

  private decorateDrops(drops: Drop[]): Drop[] {
    if (!Array.isArray(drops)) {
      return [];
    }

    const today = this.dateUtils.startOfDay(new Date());
    const parsed: (Drop & { parsedDate?: Date })[] = drops
      .map((drop) => {
        const parsedDate = this.dateUtils.parseDropDate(drop.date);
        return { ...drop, parsedDate };
      })
      .sort((a, b) => {
        if (!a.parsedDate || !b.parsedDate) {
          return 0;
        }
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      });

    const currentIndex = parsed.findIndex((drop) => drop.parsedDate && drop.parsedDate >= today);

    return parsed.map(({ parsedDate, ...drop }, index) => {
      if (!parsedDate) {
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
        date: this.dateUtils.formatDropDate(parsedDate)
      };
    });
  }

  private decorateTeam(team: Partial<Team>): Team {
    const features = Array.isArray(team.features) ? team.features.map((feature) => this.normalizeFeature(feature)) : [];
    return {
      name: team.name ?? DASHBOARD_CONSTANTS.DEFAULT_TEAM_NAME,
      iconColor: team.iconColor ?? DASHBOARD_CONSTANTS.DEFAULT_TEAM_ICON_COLOR,
      borderColor: team.borderColor ?? DASHBOARD_CONSTANTS.DEFAULT_TEAM_BORDER_COLOR,
      features
    };
  }

  private normalizeFeature(feature: Feature | string): Feature {
    if (typeof feature === 'string') {
      return { title: feature, dev: [], qa: [] };
    }

    return {
      title: feature.title,
      dev: Array.isArray(feature.dev) ? feature.dev : [],
      qa: Array.isArray(feature.qa) ? feature.qa : []
    };
  }
}
